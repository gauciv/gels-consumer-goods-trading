import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import type { Store } from '@/types';

interface StoreSelectorProps {
  stores: Store[];
  selectedId: string | null;
  onSelect: (store: Store) => void;
}

export function StoreSelector({ stores, selectedId, onSelect }: StoreSelectorProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  if (isTablet) {
    // Grid layout for tablets
    const rows: Store[][] = [];
    for (let i = 0; i < stores.length; i += 2) {
      rows.push(stores.slice(i, i + 2));
    }

    return (
      <ScrollView className="max-h-80">
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row gap-3 mb-3">
            {row.map((store) => (
              <TouchableOpacity
                key={store.id}
                className={`flex-1 p-4 border rounded-lg ${
                  selectedId === store.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-surface'
                }`}
                onPress={() => onSelect(store)}
              >
                <Text
                  className={`text-base font-semibold ${
                    selectedId === store.id ? 'text-blue-700' : 'text-gray-800'
                  }`}
                >
                  {store.name}
                </Text>
                {store.address && (
                  <Text className="text-sm text-gray-500 mt-1">{store.address}</Text>
                )}
              </TouchableOpacity>
            ))}
            {row.length === 1 && <View className="flex-1" />}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView className="max-h-64">
      {stores.map((store) => (
        <TouchableOpacity
          key={store.id}
          className={`p-4 border rounded-lg mb-2 ${
            selectedId === store.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-surface'
          }`}
          onPress={() => onSelect(store)}
        >
          <Text
            className={`text-base font-semibold ${
              selectedId === store.id ? 'text-blue-700' : 'text-gray-800'
            }`}
          >
            {store.name}
          </Text>
          {store.address && (
            <Text className="text-sm text-gray-500 mt-1">{store.address}</Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
