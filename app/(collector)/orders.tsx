import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOrders } from '@/services/orders.service';
import { formatCurrency, formatDate } from '@/lib/formatters';
import type { Order, OrderFilters } from '@/types';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-700' },
  processing: { bg: 'bg-purple-100', text: 'text-purple-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
};

const statusFilters = ['all', 'pending', 'confirmed', 'processing', 'completed', 'cancelled'] as const;
const sortOptions: { value: OrderFilters['sort_by']; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'highest', label: 'Highest' },
  { value: 'lowest', label: 'Lowest' },
];

const PAGE_SIZE = 20;

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters & pagination
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<OrderFilters['sort_by']>('newest');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchOrders = useCallback(async (silent = false, overrides?: Partial<{ p: number; status: string; sort: OrderFilters['sort_by'] }>) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const currentPage = overrides?.p ?? page;
      const currentStatus = overrides?.status ?? statusFilter;
      const currentSort = overrides?.sort ?? sortBy;
      const filters: OrderFilters = {
        page: currentPage,
        page_size: PAGE_SIZE,
        sort_by: currentSort,
      };
      if (currentStatus !== 'all') filters.status = currentStatus;
      const result = await getOrders(filters);
      setOrders(result.data);
      setTotal(result.total);
    } catch {
      setError('Failed to load orders');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, statusFilter, sortBy]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchOrders(true);
    setRefreshing(false);
  }

  function changeStatus(status: string) {
    setStatusFilter(status);
    setPage(1);
    fetchOrders(false, { p: 1, status });
  }

  function changeSort(sort: OrderFilters['sort_by']) {
    setSortBy(sort);
    setShowSortMenu(false);
    setPage(1);
    fetchOrders(false, { p: 1, sort });
  }

  function goToPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    fetchOrders(false, { p });
  }

  function getStatusStyle(status: string) {
    return statusColors[status] || { bg: 'bg-gray-100', text: 'text-gray-700' };
  }

  // Client-side search filtering (search within already-fetched page)
  const displayOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        (o.stores?.name || '').toLowerCase().includes(q)
    );
  }, [orders, search]);

  if (loading && orders.length === 0) {
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
      {/* Search bar */}
      <View className="bg-white px-3 pt-3 pb-2 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-sm text-gray-800"
            value={search}
            onChangeText={setSearch}
            placeholder="Search orders..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status filter tabs */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 6 }}
        >
          {statusFilters.map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => changeStatus(status)}
              className={`px-3 py-1.5 rounded-full ${
                statusFilter === status ? 'bg-blue-500' : 'bg-gray-100'
              }`}
            >
              <Text
                className={`text-xs font-medium capitalize ${
                  statusFilter === status ? 'text-white' : 'text-gray-600'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort bar */}
      <View className="flex-row items-center justify-between px-3 py-2 bg-white border-b border-gray-100">
        <Text className="text-xs text-gray-400">
          {total} order{total !== 1 ? 's' : ''}
          {totalPages > 1 ? ` · Page ${page}/${totalPages}` : ''}
        </Text>
        <View className="relative">
          <TouchableOpacity
            className="flex-row items-center gap-1 px-2.5 py-1.5 bg-gray-100 rounded-lg"
            onPress={() => setShowSortMenu(!showSortMenu)}
          >
            <Ionicons name="swap-vertical-outline" size={14} color="#6b7280" />
            <Text className="text-xs font-medium text-gray-600">
              {sortOptions.find((s) => s.value === sortBy)?.label}
            </Text>
          </TouchableOpacity>
          {showSortMenu && (
            <View
              className="absolute right-0 top-9 bg-white rounded-xl border border-gray-200 shadow-lg z-50 w-36 overflow-hidden"
              style={{ elevation: 8 }}
            >
              {sortOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  className={`px-4 py-2.5 border-b border-gray-50 ${
                    sortBy === opt.value ? 'bg-blue-50' : ''
                  }`}
                  onPress={() => changeSort(opt.value)}
                >
                  <Text
                    className={`text-sm ${
                      sortBy === opt.value ? 'text-blue-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Order list */}
      {displayOrders.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="receipt-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-500 mt-3 text-center">
            {search ? 'No orders match your search' : 'No orders found'}
          </Text>
          <Text className="text-gray-400 text-sm mt-1 text-center">
            {search ? 'Try adjusting your search' : 'Your order history will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListFooterComponent={() =>
            totalPages > 1 ? (
              <View className="flex-row items-center justify-between bg-white mx-0 mt-2 px-4 py-3 rounded-xl border border-gray-100">
                <TouchableOpacity
                  onPress={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className={page === 1 ? 'opacity-30' : 'opacity-100'}
                >
                  <Text className="text-sm font-medium text-blue-500">← Prev</Text>
                </TouchableOpacity>
                <View className="items-center">
                  <Text className="text-sm font-medium text-gray-700">
                    Page {page} of {totalPages}
                  </Text>
                  <Text className="text-xs text-gray-400">{total} total</Text>
                </View>
                <TouchableOpacity
                  onPress={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className={page >= totalPages ? 'opacity-30' : 'opacity-100'}
                >
                  <Text className="text-sm font-medium text-blue-500">Next →</Text>
                </TouchableOpacity>
              </View>
            ) : null
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
                {item.stores?.name && (
                  <View className="flex-row items-center gap-1.5 mb-1.5">
                    <Ionicons name="storefront-outline" size={12} color="#9ca3af" />
                    <Text className="text-xs text-gray-500">{item.stores.name}</Text>
                  </View>
                )}
                {/* Items preview */}
                {item.order_items && item.order_items.length > 0 && (
                  <View className="mb-2">
                    {item.order_items.slice(0, 2).map((oi) => (
                      <Text key={oi.id} className="text-xs text-gray-400" numberOfLines={1}>
                        {oi.quantity}x {oi.product_name}
                      </Text>
                    ))}
                    {item.order_items.length > 2 && (
                      <Text className="text-xs text-gray-400">
                        +{item.order_items.length - 2} more
                      </Text>
                    )}
                  </View>
                )}
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

      {/* Loading overlay for page changes */}
      {loading && orders.length > 0 && (
        <View className="absolute inset-0 bg-white/60 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}

      {/* Order Detail Modal - Center positioned */}
      <Modal
        visible={!!selectedOrder}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrder(null)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 items-center justify-center px-4"
          activeOpacity={1}
          onPress={() => setSelectedOrder(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View className="bg-white rounded-2xl w-full max-h-[80%]" style={{ maxWidth: 420, width: '100%' }}>
              {selectedOrder && (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ padding: 20 }}
                >
                  {/* Header */}
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-gray-800">
                      {selectedOrder.order_number}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <View className={`px-3 py-1 rounded-full ${getStatusStyle(selectedOrder.status).bg}`}>
                        <Text className={`text-xs font-medium capitalize ${getStatusStyle(selectedOrder.status).text}`}>
                          {selectedOrder.status}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                        <Ionicons name="close" size={22} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Meta */}
                  <View className="bg-gray-50 rounded-xl p-3 mb-4">
                    <View className="flex-row items-center gap-2 mb-1.5">
                      <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-600">
                        {formatDate(selectedOrder.created_at)}
                      </Text>
                    </View>
                    {selectedOrder.stores?.name && (
                      <View className="flex-row items-center gap-2">
                        <Ionicons name="storefront-outline" size={14} color="#6b7280" />
                        <Text className="text-sm text-gray-600">
                          {selectedOrder.stores.name}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Items */}
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Items ({selectedOrder.order_items?.length || 0})
                    </Text>
                    {selectedOrder.order_items?.map((item) => (
                      <View key={item.id} className="flex-row items-center justify-between py-2.5 border-b border-gray-100">
                        <View className="flex-1 mr-3">
                          <Text className="text-sm text-gray-800">{item.product_name}</Text>
                          <Text className="text-xs text-gray-400">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </Text>
                        </View>
                        <Text className="text-sm font-semibold text-gray-800">
                          {formatCurrency(item.line_total)}
                        </Text>
                      </View>
                    ))}
                    {(!selectedOrder.order_items || selectedOrder.order_items.length === 0) && (
                      <Text className="text-xs text-gray-400 py-2">No items recorded</Text>
                    )}
                  </View>

                  {/* Summary */}
                  <View className="bg-blue-50 rounded-xl p-3 mb-4">
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-sm text-gray-600">Subtotal</Text>
                      <Text className="text-sm text-gray-700">
                        {formatCurrency(selectedOrder.subtotal)}
                      </Text>
                    </View>
                    {selectedOrder.tax_amount > 0 && (
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm text-gray-600">Tax</Text>
                        <Text className="text-sm text-gray-700">
                          {formatCurrency(selectedOrder.tax_amount)}
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center justify-between pt-2 border-t border-blue-200">
                      <Text className="text-base font-bold text-gray-800">Total</Text>
                      <Text className="text-lg font-bold text-blue-600">
                        {formatCurrency(selectedOrder.total_amount)}
                      </Text>
                    </View>
                  </View>

                  {selectedOrder.notes && (
                    <View className="mb-4 bg-gray-50 rounded-xl p-3">
                      <Text className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</Text>
                      <Text className="text-sm text-gray-600">{selectedOrder.notes}</Text>
                    </View>
                  )}

                  {/* Close button */}
                  <TouchableOpacity
                    className="bg-gray-100 rounded-xl py-3 items-center"
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
