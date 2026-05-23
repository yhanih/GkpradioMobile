import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setCartItems(JSON.parse(storedCart));
      }
    } catch (error) {
      console.error('[CartContext] Failed to load cart from storage:', error);
    }
  };

  const saveCart = async (items: CartItem[]) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('[CartContext] Failed to save cart to storage:', error);
    }
  };

  const addToCart = (
    item: Omit<CartItem, 'id' | 'quantity'> & { size?: string; color?: string; quantity?: number }
  ) => {
    setCartItems((prevItems) => {
      const quantityToAdd = item.quantity ?? 1;
      const sizeStr = item.size ?? '';
      const colorStr = item.color ?? '';
      const itemId = `${item.productId}_${sizeStr}_${colorStr}`;

      const existingIndex = prevItems.findIndex((i) => i.id === itemId);
      let updatedItems: CartItem[];

      if (existingIndex > -1) {
        updatedItems = [...prevItems];
        updatedItems[existingIndex].quantity += quantityToAdd;
      } else {
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
        updatedItems = [...prevItems, newItem];
      }

      saveCart(updatedItems);
      return updatedItems;
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== id);
      saveCart(updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === id ? { ...item, quantity } : item
      );
      saveCart(updatedItems);
      return updatedItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    AsyncStorage.removeItem(CART_STORAGE_KEY);
  };

  const cartTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
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
