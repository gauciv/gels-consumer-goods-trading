import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { CartItem } from '@/types';

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
  // Draft cart (current ordering session, no store assigned yet)
  draftItems: CartItem[];
  addDraftItem: (product: { id: string; name: string; price: number; stock_quantity: number }, quantity?: number) => void;
  removeDraftItem: (productId: string) => void;
  updateDraftQuantity: (productId: string, quantity: number) => void;
  getDraftSubtotal: () => number;
  getDraftItemCount: () => number;
  clearDraft: () => void;

  // Legacy store-based cart (kept for backward compat with existing store cards)
  storeOrders: StoreOrder[];
  activeStoreId: string | null;
  setActiveStore: (id: string | null) => void;
  addStoreOrder: (id: string, name: string) => void;
  removeStoreOrder: (id: string) => void;
  renameStoreOrder: (id: string, newName: string) => void;
  isStoreAdded: (id: string) => boolean;
  items: CartItem[];
  addItem: (product: { id: string; name: string; price: number; stock_quantity: number }, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItemFromStore: (storeId: string, productId: string) => void;
  updateQuantityInStore: (storeId: string, productId: string, quantity: number) => void;
  getStoreItems: (storeId: string) => CartItem[];
  getStoreSubtotal: (storeId: string) => number;
  getItemCount: () => number;
  clearAll: () => void;
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
  const [draftItems, setDraftItems] = useState<CartItem[]>([]);

  // ─── Draft cart operations ───────────────────────────────────────────

  const addDraftItem = useCallback(
    (product: { id: string; name: string; price: number; stock_quantity: number }, quantity = 1) => {
      if (product.price < 0 || product.stock_quantity < 0 || quantity <= 0) return;
      setDraftItems((prev) => {
        const existing = prev.find((i) => i.product_id === product.id);
        if (existing) {
          const newQty = existing.quantity + quantity;
          if (newQty > product.stock_quantity) return prev;
          return prev.map((i) =>
            i.product_id === product.id
              ? { ...i, quantity: newQty, line_total: newQty * i.unit_price }
              : i
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

  const removeDraftItem = useCallback((productId: string) => {
    setDraftItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const updateDraftQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setDraftItems((prev) => prev.filter((i) => i.product_id !== productId));
      return;
    }
    setDraftItems((prev) =>
      prev.map((i) =>
        i.product_id === productId
          ? {
              ...i,
              quantity: Math.min(quantity, i.stock_quantity),
              line_total: Math.min(quantity, i.stock_quantity) * i.unit_price,
            }
          : i
      )
    );
  }, []);

  const getDraftSubtotal = useCallback(
    () => draftItems.reduce((sum, i) => sum + i.line_total, 0),
    [draftItems]
  );

  const getDraftItemCount = useCallback(
    () => draftItems.reduce((sum, i) => sum + i.quantity, 0),
    [draftItems]
  );

  const clearDraft = useCallback(() => {
    setDraftItems([]);
  }, []);

  // ─── Store-based cart operations (legacy) ───────────────────────────

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

  const renameStoreOrder = useCallback((id: string, newName: string) => {
    setStoreOrders((prev) =>
      prev.map((o) => o.storeId === id ? { ...o, storeName: newName } : o)
    );
    setSubmittedHistory((prev) =>
      prev.map((r) => r.storeId === id ? { ...r, storeName: newName } : r)
    );
  }, []);

  const isStoreAdded = useCallback(
    (id: string) => storeOrders.some((o) => o.storeId === id),
    [storeOrders]
  );

  const addItem = useCallback(
    (product: { id: string; name: string; price: number; stock_quantity: number }, quantity = 1) => {
      // Now operates on draft items instead of requiring activeStoreId
      addDraftItem(product, quantity);
    },
    [addDraftItem]
  );

  const removeItem = useCallback(
    (productId: string) => {
      removeDraftItem(productId);
    },
    [removeDraftItem]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      updateDraftQuantity(productId, quantity);
    },
    [updateDraftQuantity]
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
    () => {
      const storeCount = storeOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
      const draftCount = draftItems.reduce((sum, i) => sum + i.quantity, 0);
      return storeCount + draftCount;
    },
    [storeOrders, draftItems]
  );

  const markStoreSubmitted = useCallback((storeId: string, storeName: string, itemCount: number, subtotal: number, items: CartItem[]) => {
    setSubmittedStores((prev) => new Set(prev).add(storeId));
    setSubmittedHistory((prev) => [
      { storeId, storeName, itemCount, subtotal, submittedAt: new Date(), items },
      ...prev,
    ]);
    setStoreOrders((prev) =>
      prev.map((o) => o.storeId === storeId ? { ...o, items: [] } : o)
    );
  }, []);

  const clearAll = useCallback(() => {
    setStoreOrders([]);
    setActiveStoreId(null);
    setSubmittedStores(new Set());
    setSubmittedHistory([]);
    setDraftItems([]);
  }, []);

  // items now reflects draftItems for the products screen
  const items = useMemo(() => draftItems, [draftItems]);

  return (
    <CartContext.Provider
      value={{
        draftItems,
        addDraftItem,
        removeDraftItem,
        updateDraftQuantity,
        getDraftSubtotal,
        getDraftItemCount,
        clearDraft,
        storeOrders,
        activeStoreId,
        setActiveStore,
        addStoreOrder,
        removeStoreOrder,
        renameStoreOrder,
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
