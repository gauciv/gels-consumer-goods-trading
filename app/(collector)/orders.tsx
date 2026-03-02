import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOrders } from '@/services/orders.service';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Order } from '@/types';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  processing: { bg: 'bg-purple-100', text: 'text-purple-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await getOrders({ page_size: 50 });
      setOrders(result.data);
    } catch {
      setError('Failed to load orders');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  }

  function getStatusStyle(status: string) {
    return statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error && orders.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-4">
        <Ionicons name="cloud-offline-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-500 mt-3 text-center">{error}</Text>
        <TouchableOpacity
          className="mt-4 bg-blue-500 rounded-xl px-6 py-3"
          onPress={() => fetchOrders()}
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {orders.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-500 mt-3 text-center">No orders yet</Text>
          <Text className="text-gray-400 text-sm mt-1 text-center">
            Your order history will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          renderItem={({ item }) => {
            const style = getStatusStyle(item.status);
            const itemCount = item.order_items?.length || 0;

            return (
              <TouchableOpacity
                className="bg-white rounded-xl p-4 mb-2.5 border border-gray-100"
                onPress={() => setSelectedOrder(item)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-bold text-gray-800">
                    {item.order_number}
                  </Text>
                  <View className={`px-2.5 py-1 rounded-full ${style.bg}`}>
                    <Text className={`text-xs font-medium capitalize ${style.text}`}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-xs text-gray-400">
                      {formatDate(item.created_at)}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-0.5">
                      {itemCount} item{itemCount !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text className="text-base font-bold text-blue-600">
                    {formatCurrency(item.total_amount)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Order Detail Modal */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setSelectedOrder(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View className="bg-white rounded-t-2xl px-6 pt-6 pb-10 max-h-[85%]">
              {selectedOrder && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-gray-800">
                      {selectedOrder.order_number}
                    </Text>
                    <View className={`px-3 py-1 rounded-full ${getStatusStyle(selectedOrder.status).bg}`}>
                      <Text className={`text-xs font-medium capitalize ${getStatusStyle(selectedOrder.status).text}`}>
                        {selectedOrder.status}
                      </Text>
                    </View>
                  </View>

                  {/* Meta */}
                  <View className="mb-4">
                    <Text className="text-xs text-gray-400">
                      {formatDate(selectedOrder.created_at)}
                    </Text>
                    {selectedOrder.stores?.name && (
                      <Text className="text-sm text-gray-600 mt-1">
                        Store: {selectedOrder.stores.name}
                      </Text>
                    )}
                  </View>

                  {/* Items */}
                  <View className="border-t border-gray-100 pt-3 mb-3">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Items</Text>
                    {selectedOrder.order_items?.map((item) => (
                      <View key={item.id} className="flex-row items-center justify-between py-2 border-b border-gray-50">
                        <View className="flex-1 mr-3">
                          <Text className="text-sm text-gray-800">{item.product_name}</Text>
                          <Text className="text-xs text-gray-400">
                            {item.quantity} x {formatCurrency(item.unit_price)}
                          </Text>
                        </View>
                        <Text className="text-sm font-medium text-gray-800">
                          {formatCurrency(item.line_total)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Total */}
                  <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                    <Text className="text-base font-bold text-gray-800">Total</Text>
                    <Text className="text-lg font-bold text-blue-600">
                      {formatCurrency(selectedOrder.total_amount)}
                    </Text>
                  </View>

                  {selectedOrder.notes && (
                    <View className="mt-3 pt-3 border-t border-gray-100">
                      <Text className="text-xs text-gray-400">Notes</Text>
                      <Text className="text-sm text-gray-600 mt-1">{selectedOrder.notes}</Text>
                    </View>
                  )}

                  {/* Close button */}
                  <TouchableOpacity
                    className="mt-5 bg-gray-100 rounded-xl py-3.5 items-center"
                    onPress={() => setSelectedOrder(null)}
                  >
                    <Text className="text-gray-700 font-semibold">Close</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
