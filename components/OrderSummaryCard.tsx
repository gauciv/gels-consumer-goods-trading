import React from 'react';
import { View, Text } from 'react-native';
import { formatCurrency } from '@/lib/formatters';
import type { CartItem } from '@/types';

interface OrderSummaryCardProps {
  items: CartItem[];
  storeName: string;
  subtotal: number;
}

export function OrderSummaryCard({ items, storeName, subtotal }: OrderSummaryCardProps) {
  return (
    <View className="bg-surface rounded-lg p-4 border border-gray-100">
      <Text className="text-sm text-gray-500 mb-3">Store: {storeName}</Text>
      {items.map((item) => (
        <View key={item.product_id} className="flex-row justify-between py-2 border-b border-gray-50">
          <View className="flex-1">
            <Text className="text-sm text-gray-800">{item.product_name}</Text>
            <Text className="text-xs text-gray-500">
              {item.quantity} x {formatCurrency(item.unit_price)}
            </Text>
          </View>
          <Text className="text-sm font-semibold text-gray-800">
            {formatCurrency(item.line_total)}
          </Text>
        </View>
      ))}
      <View className="flex-row justify-between mt-4 pt-3 border-t border-gray-200">
        <Text className="text-base font-bold text-gray-800">Total</Text>
        <Text className="text-base font-bold text-blue-600">{formatCurrency(subtotal)}</Text>
      </View>
    </View>
  );
}
