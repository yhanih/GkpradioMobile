import React from 'react';

import { CartSheet } from './CartSheet';
import { useCart } from '../contexts/CartContext';

/** Single cart modal for the whole app — avoids per-screen state getting out of sync. */
export function GlobalCartSheet() {
  const { isCartOpen, closeCart } = useCart();
  return <CartSheet visible={isCartOpen} onClose={closeCart} />;
}
