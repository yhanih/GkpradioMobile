import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../contexts/ThemeContext';
import { useCart, CartItem } from '../contexts/CartContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { AnimatedButton } from './AnimatedPressable';
import { prepareStoreCheckout } from '../lib/merch';
import * as WebBrowser from 'expo-web-browser';

interface CartSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function CartSheet({ visible, onClose }: CartSheetProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const { cartItems, isCartReady, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const shippingCost = cartTotal >= 50 || cartTotal === 0 ? 0 : 5.99;
  const orderTotal = cartTotal + shippingCost;

  const handleQtyMinus = (item: CartItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQuantity(item.id, item.quantity - 1);
  };

  const handleQtyPlus = (item: CartItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleRemove = (item: CartItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeFromCart(item.id);
  };

  const handleSecureCheckout = async () => {
    if (!isCartReady || cartItems.length === 0 || checkoutLoading) return;

    Haptics.selectionAsync();
    setCheckoutLoading(true);

    try {
      const checkoutUrl = await prepareStoreCheckout(cartItems);
      onClose();

      navigation.navigate('GameWebView', {
        url: checkoutUrl,
        title: 'Secure Checkout',
        returnTab: 'Home',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Checkout could not be started. Please try again.';
      Alert.alert('Checkout Error', message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleClose = () => {
    if (!checkoutLoading) {
      onClose();
    }
  };

  const handleClearCart = () => {
    if (cartItems.length === 0 || checkoutLoading) return;

    Alert.alert(
      'Clear cart?',
      'Remove all items from your cart. Do this after you have completed payment on the website.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear cart',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            clearCart();
          },
        },
      ]
    );
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={[styles.cartItem, { borderBottomColor: theme.colors.border }]}>
      <Image source={{ uri: item.image }} style={styles.itemImage} />
      <View style={styles.itemDetails}>
        <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {(item.size || item.color) && (
          <Text style={[styles.itemSpecs, { color: theme.colors.textMuted }]}>
            {item.size ? `Size: ${item.size}` : ''}
            {item.size && item.color ? '  |  ' : ''}
            {item.color ? `Color: ${item.color}` : ''}
          </Text>
        )}
        <Text style={[styles.itemPrice, { color: theme.colors.text }]}>
          ${item.price.toFixed(2)}
        </Text>
      </View>

      <View style={styles.qtyContainer}>
        <Pressable
          style={({ pressed }) => [styles.qtyBtn, { backgroundColor: theme.colors.surfaceSecondary }, pressed && styles.qtyBtnPressed]}
          onPress={() => handleQtyMinus(item)}
          disabled={checkoutLoading}
        >
          <Ionicons name="remove" size={14} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.qtyText, { color: theme.colors.text }]}>{item.quantity}</Text>
        <Pressable
          style={({ pressed }) => [styles.qtyBtn, { backgroundColor: theme.colors.surfaceSecondary }, pressed && styles.qtyBtnPressed]}
          onPress={() => handleQtyPlus(item)}
          disabled={checkoutLoading}
        >
          <Ionicons name="add" size={14} color={theme.colors.text} />
        </Pressable>
      </View>

      <Pressable onPress={() => handleRemove(item)} style={styles.removeBtn} disabled={checkoutLoading}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </Pressable>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.backBtnPlaceholder} />
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Shopping Cart</Text>
          <Pressable onPress={handleClose} style={styles.closeBtn} disabled={checkoutLoading}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </Pressable>
        </View>

        <View style={styles.flexOne}>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {!isCartReady ? (
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                ) : (
                  <>
                    <Ionicons name="cart-outline" size={64} color={theme.colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Your cart is empty</Text>
                    <Text style={[styles.emptySub, { color: theme.colors.textMuted }]}>
                      Explore our premium store collection to support the ministry.
                    </Text>
                  </>
                )}
              </View>
            }
          />

          {cartItems.length > 0 && (
            <View style={[styles.summaryFooter, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
              <Text style={[styles.checkoutNote, { color: theme.colors.textMuted }]}>
                You will open our secure checkout in your browser with these items pre-loaded. Your in-app cart stays until you clear it after payment.
              </Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text }]}>${cartTotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>Shipping</Text>
                <Text style={[styles.summaryValue, { color: shippingCost === 0 ? theme.colors.success : theme.colors.text }]}>
                  {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: theme.colors.text }]}>Estimated total</Text>
                <Text style={[styles.totalValue, { color: theme.colors.text }]}>${orderTotal.toFixed(2)}</Text>
              </View>

              <AnimatedButton
                variant="primary"
                style={styles.checkoutBtn}
                onPress={handleSecureCheckout}
                disabled={checkoutLoading || !isCartReady}
              >
                {checkoutLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.checkoutBtnText}>Continue to Secure Checkout</Text>
                  </>
                )}
              </AnimatedButton>

              <Pressable
                onPress={handleClearCart}
                disabled={checkoutLoading}
                style={({ pressed }) => [styles.clearCartBtn, pressed && styles.clearCartBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Clear cart"
              >
                <Text style={[styles.clearCartBtnText, { color: theme.colors.textMuted }]}>
                  Clear cart
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexOne: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtnPlaceholder: {
    width: 32,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  itemImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: '#f4f4f5',
  },
  itemDetails: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemSpecs: {
    fontSize: 11,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnPressed: {
    opacity: 0.7,
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  summaryFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  checkoutNote: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 12,
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  checkoutBtn: {
    marginTop: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  clearCartBtn: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  clearCartBtnPressed: {
    opacity: 0.6,
  },
  clearCartBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
