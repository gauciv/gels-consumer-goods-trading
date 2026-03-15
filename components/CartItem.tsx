import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { QuantitySelector } from './QuantitySelector';
import { formatCurrency } from '@/lib/formatters';
import type { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-gray-100">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-gray-800">{item.product_name}</Text>
          <Text className="text-sm text-gray-500 mt-1">
            {formatCurrency(item.unit_price)} each
          </Text>
        </View>
        <TouchableOpacity onPress={() => onRemove(item.product_id)}>
          <Text className="text-red-500 text-sm">Remove</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row justify-between items-center mt-3">
        <QuantitySelector
          value={item.quantity}
          max={item.stock_quantity}
          onChange={(qty) => onUpdateQuantity(item.product_id, qty)}
        />
        <Text className="text-lg font-bold text-blue-600">
          {formatCurrency(item.line_total)}
        </Text>
      </View>
    </View>
  );
}
