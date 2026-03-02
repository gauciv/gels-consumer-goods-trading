import { useState, useRef } from 'react';
import { createOrder } from '@/services/orders.service';
import { useCart } from '@/lib/cart';
import type { CreateOrderResponse } from '@/types';

export function useOrderSubmit() {
  const { items, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  async function submitOrder(notes?: string): Promise<CreateOrderResponse | null> {
    if (items.length === 0) {
      setError('Cart is empty');
      return null;
    }

    // Prevent double-submit
    if (submittingRef.current) return null;
    submittingRef.current = true;

    setLoading(true);
    setError(null);

    try {
      const result = await createOrder({
        notes,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      });
      clearCart();
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to submit order');
      return null;
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  return { submitOrder, loading, error };
}
