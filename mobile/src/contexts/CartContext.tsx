import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  id: string; // unique combination of product id + size + color
  productId: string;
  name: string;
  price: number;
  image: string;
  category: string;
  size?: string;
  color?: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartReady: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'> & { size?: string; color?: string; quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = '@gkp_shopping_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartReady, setIsCartReady] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartTouchedRef = useRef(false);

  const markCartTouched = () => {
    cartTouchedRef.current = true;
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (cancelled) return;

        if (storedCart && !cartTouchedRef.current) {
          const parsed = JSON.parse(storedCart) as CartItem[];
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
          }
        }
      } catch (error) {
        console.error('[CartContext] Failed to load cart from storage:', error);
      } finally {
        if (!cancelled) {
          setIsCartReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isCartReady) return;

    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems)).catch((error) => {
      console.error('[CartContext] Failed to save cart to storage:', error);
    });
  }, [cartItems, isCartReady]);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const addToCart = (
    item: Omit<CartItem, 'id' | 'quantity'> & { size?: string; color?: string; quantity?: number }
  ) => {
    markCartTouched();
    setCartItems((prevItems) => {
      const quantityToAdd = item.quantity ?? 1;
      const sizeStr = item.size ?? '';
      const colorStr = item.color ?? '';
      const itemId = `${item.productId}_${sizeStr}_${colorStr}`;

      const existingIndex = prevItems.findIndex((i) => i.id === itemId);

      if (existingIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + quantityToAdd,
        };
        return updatedItems;
      }

      const newItem: CartItem = {
        id: itemId,
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category,
        size: item.size,
        color: item.color,
        quantity: quantityToAdd,
      };
      return [...prevItems, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    markCartTouched();
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    markCartTouched();
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    markCartTouched();
    setCartItems([]);
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch((error) => {
      console.error('[CartContext] Failed to clear cart from storage:', error);
    });
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartReady,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
