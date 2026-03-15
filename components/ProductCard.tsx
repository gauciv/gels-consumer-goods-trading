import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatCurrency } from '@/lib/formatters';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  cartQuantity?: number;
}

export function ProductCard({ product, onAdd, cartQuantity = 0 }: ProductCardProps) {
  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <View className="bg-surface rounded-lg p-4 mb-3 border border-gray-100 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-gray-800">{product.name}</Text>
          {product.categories?.name && (
            <Text className="text-xs text-blue-500 mt-1">{product.categories.name}</Text>
          )}
          {product.description && (
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
              {product.description}
            </Text>
          )}
          <Text className="text-lg font-bold text-blue-600 mt-2">
            {formatCurrency(product.price)}
          </Text>
          <Text
            className={`text-xs mt-1 ${
              isOutOfStock ? 'text-red-500' : product.stock_quantity < 10 ? 'text-orange-500' : 'text-green-600'
            }`}
          >
            {isOutOfStock
              ? 'Out of stock'
              : `${product.stock_quantity} ${product.unit}(s) available`}
          </Text>
        </View>
        <View className="items-center">
          <TouchableOpacity
            className={`px-4 py-2 rounded-lg ${isOutOfStock ? 'bg-gray-300' : 'bg-blue-500'}`}
            onPress={() => onAdd(product)}
            disabled={isOutOfStock}
          >
            <Text className="text-white font-semibold text-sm">
              {cartQuantity > 0 ? `In Cart (${cartQuantity})` : 'Add'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
