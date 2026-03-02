import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  storeId: string | null;
  storeName: string | null;
  setStore: (id: string, name: string) => void;
  addItem: (product: { id: string; name: string; price: number; stock_quantity: number }, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);

  const setStore = useCallback((id: string, name: string) => {
    setStoreId(id);
    setStoreName(name);
  }, []);

  const addItem = useCallback(
    (product: { id: string; name: string; price: number; stock_quantity: number }, quantity = 1) => {
      if (product.price < 0 || product.stock_quantity < 0 || quantity <= 0) return;
      setItems((prev) => {
        const existing = prev.find((item) => item.product_id === product.id);
        if (existing) {
          const newQty = existing.quantity + quantity;
          if (newQty > product.stock_quantity) return prev;
          return prev.map((item) =>
            item.product_id === product.id
              ? { ...item, quantity: newQty, line_total: newQty * item.unit_price }
              : item
          );
        }
        if (quantity > product.stock_quantity) return prev;
        return [
          ...prev,
          {
            product_id: product.id,
            product_name: product.name,
            unit_price: product.price,
            quantity,
            stock_quantity: product.stock_quantity,
            line_total: quantity * product.price,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: Math.min(quantity, item.stock_quantity), line_total: Math.min(quantity, item.stock_quantity) * item.unit_price }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
    // Don't reset store - it's tied to the user's branch
  }, []);

  const getSubtotal = useCallback(() => {
    return items.reduce((sum, item) => sum + item.line_total, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        storeId,
        storeName,
        setStore,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getSubtotal,
        getItemCount,
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
