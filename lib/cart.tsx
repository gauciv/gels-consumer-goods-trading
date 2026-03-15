import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem } from '@/types';

const CART_STORAGE_KEY = '@gels/cart_state';

type StoreOrder = {
  storeId: string;
  storeName: string;
  items: CartItem[];
};

export type SubmittedRecord = {
  storeId: string;
  storeName: string;
  itemCount: number;
  subtotal: number;
  submittedAt: Date;
  items: CartItem[];
};

interface CartContextType {
  storeOrders: StoreOrder[];
  activeStoreId: string | null;
  setActiveStore: (id: string | null) => void;
  addStoreOrder: (id: string, name: string) => void;
  removeStoreOrder: (id: string) => void;
  isStoreAdded: (id: string) => boolean;
  // operate on activeStoreId:
  items: CartItem[];
  addItem: (product: { id: string; name: string; price: number; stock_quantity: number }, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  // operate on a specific store (for cart screen):
  removeItemFromStore: (storeId: string, productId: string) => void;
  updateQuantityInStore: (storeId: string, productId: string, quantity: number) => void;
  getStoreItems: (storeId: string) => CartItem[];
  getStoreSubtotal: (storeId: string) => number;
  getItemCount: () => number;
  clearAll: () => void;
  // submitted tracking (persists across navigation):
  submittedStores: Set<string>;
  submittedHistory: SubmittedRecord[];
  markStoreSubmitted: (storeId: string, storeName: string, itemCount: number, subtotal: number, items: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string | null>(null);
  const [submittedStores, setSubmittedStores] = useState<Set<string>>(new Set());
  const [submittedHistory, setSubmittedHistory] = useState<SubmittedRecord[]>([]);

  // Tracks whether the initial AsyncStorage load has completed.
  // We must not save back to storage until after the first load finishes,
  // otherwise the empty initial state would overwrite the persisted data.
  const loaded = useRef(false);

  // ── Load persisted state on mount ──────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (Array.isArray(data.storeOrders))      setStoreOrders(data.storeOrders);
          if (data.activeStoreId !== undefined)      setActiveStoreId(data.activeStoreId);
          if (Array.isArray(data.submittedStores))   setSubmittedStores(new Set<string>(data.submittedStores));
          if (Array.isArray(data.submittedHistory)) {
            setSubmittedHistory(
              data.submittedHistory.map((r: any) => ({
                ...r,
                submittedAt: new Date(r.submittedAt),
              }))
            );
          }
        } catch (_) {
          // Corrupted storage — start fresh
        }
      }
      loaded.current = true;
    });
  }, []);

  // ── Persist on every state change (after initial load) ────────────────────
  useEffect(() => {
    if (!loaded.current) return;
    const snapshot = {
      storeOrders,
      activeStoreId,
      submittedStores: [...submittedStores],
      submittedHistory,
    };
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {});
  }, [storeOrders, activeStoreId, submittedStores, submittedHistory]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const setActiveStore = useCallback((id: string | null) => {
    setActiveStoreId(id);
  }, []);

  const addStoreOrder = useCallback((id: string, name: string) => {
    setStoreOrders((prev) => {
      if (prev.some((o) => o.storeId === id)) return prev;
      return [...prev, { storeId: id, storeName: name, items: [] }];
    });
  }, []);

  const removeStoreOrder = useCallback((id: string) => {
    setStoreOrders((prev) => prev.filter((o) => o.storeId !== id));
    setActiveStoreId((prev) => (prev === id ? null : prev));
    setSubmittedStores((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setSubmittedHistory((prev) => prev.filter((r) => r.storeId !== id));
  }, []);

  const isStoreAdded = useCallback(
    (id: string) => storeOrders.some((o) => o.storeId === id),
    [storeOrders]
  );

  const addItem = useCallback(
    (product: { id: string; name: string; price: number; stock_quantity: number }, quantity = 1) => {
      if (!activeStoreId) return;
      if (product.price < 0 || product.stock_quantity < 0 || quantity <= 0) return;
      setStoreOrders((prev) =>
        prev.map((order) => {
          if (order.storeId !== activeStoreId) return order;
          const existing = order.items.find((i) => i.product_id === product.id);
          if (existing) {
            const newQty = existing.quantity + quantity;
            if (newQty > product.stock_quantity) return order;
            return {
              ...order,
              items: order.items.map((i) =>
                i.product_id === product.id
                  ? { ...i, quantity: newQty, line_total: newQty * i.unit_price }
                  : i
              ),
            };
          }
          if (quantity > product.stock_quantity) return order;
          return {
            ...order,
            items: [
              ...order.items,
              {
                product_id: product.id,
                product_name: product.name,
                unit_price: product.price,
                quantity,
                stock_quantity: product.stock_quantity,
                line_total: quantity * product.price,
              },
            ],
          };
        })
      );
    },
    [activeStoreId]
  );

  const removeItem = useCallback(
    (productId: string) => {
      if (!activeStoreId) return;
      setStoreOrders((prev) =>
        prev.map((order) =>
          order.storeId !== activeStoreId
            ? order
            : { ...order, items: order.items.filter((i) => i.product_id !== productId) }
        )
      );
    },
    [activeStoreId]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (!activeStoreId) return;
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      setStoreOrders((prev) =>
        prev.map((order) => {
          if (order.storeId !== activeStoreId) return order;
          return {
            ...order,
            items: order.items.map((i) =>
              i.product_id === productId
                ? {
                    ...i,
                    quantity: Math.min(quantity, i.stock_quantity),
                    line_total: Math.min(quantity, i.stock_quantity) * i.unit_price,
                  }
                : i
            ),
          };
        })
      );
    },
    [activeStoreId, removeItem]
  );

  const getStoreItems = useCallback(
    (storeId: string): CartItem[] =>
      storeOrders.find((o) => o.storeId === storeId)?.items ?? [],
    [storeOrders]
  );

  const removeItemFromStore = useCallback((storeId: string, productId: string) => {
    setStoreOrders((prev) =>
      prev.map((order) =>
        order.storeId !== storeId
          ? order
          : { ...order, items: order.items.filter((i) => i.product_id !== productId) }
      )
    );
  }, []);

  const updateQuantityInStore = useCallback((storeId: string, productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromStore(storeId, productId);
      return;
    }
    setStoreOrders((prev) =>
      prev.map((order) => {
        if (order.storeId !== storeId) return order;
        return {
          ...order,
          items: order.items.map((i) =>
            i.product_id === productId
              ? {
                  ...i,
                  quantity: Math.min(quantity, i.stock_quantity),
                  line_total: Math.min(quantity, i.stock_quantity) * i.unit_price,
                }
              : i
          ),
        };
      })
    );
  }, [removeItemFromStore]);

  const getStoreSubtotal = useCallback(
    (storeId: string): number =>
      (storeOrders.find((o) => o.storeId === storeId)?.items ?? []).reduce(
        (sum, i) => sum + i.line_total,
        0
      ),
    [storeOrders]
  );

  const getItemCount = useCallback(
    () => storeOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0),
    [storeOrders]
  );

  const markStoreSubmitted = useCallback((storeId: string, storeName: string, itemCount: number, subtotal: number, items: CartItem[]) => {
    setSubmittedStores((prev) => new Set(prev).add(storeId));
    setSubmittedHistory((prev) => [
      { storeId, storeName, itemCount, subtotal, submittedAt: new Date(), items },
      ...prev,
    ]);
    // Clear items from the live store order so product highlights reset
    setStoreOrders((prev) =>
      prev.map((o) => o.storeId === storeId ? { ...o, items: [] } : o)
    );
  }, []);

  const clearAll = useCallback(() => {
    setStoreOrders([]);
    setActiveStoreId(null);
    setSubmittedStores(new Set());
    setSubmittedHistory([]);
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
  }, []);

  const items = useMemo(
    () => storeOrders.find((o) => o.storeId === activeStoreId)?.items ?? [],
    [storeOrders, activeStoreId]
  );

  return (
    <CartContext.Provider
      value={{
        storeOrders,
        activeStoreId,
        setActiveStore,
        addStoreOrder,
        removeStoreOrder,
        isStoreAdded,
        items,
        addItem,
        removeItem,
        updateQuantity,
        removeItemFromStore,
        updateQuantityInStore,
        getStoreItems,
        getStoreSubtotal,
        getItemCount,
        clearAll,
        submittedStores,
        submittedHistory,
        markStoreSubmitted,
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
