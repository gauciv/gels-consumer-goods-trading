import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  useWindowDimensions,
  Platform,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/lib/cart';
import { useNotifications } from '@/hooks/useNotifications';
import { formatCurrency, formatShortDate } from '@/lib/formatters';
import type { Product } from '@/types';

export default function ProductsScreen() {
  const {
    products,
    loading,
    error,
    search,
    setSearch,
    page,
    totalPages,
    total,
    nextPage,
    prevPage,
    refreshing,
    refresh,
  } = useProducts();
  const { addItem, updateQuantity, draftItems, getDraftItemCount, getDraftSubtotal } = useCart();
  const { unreadCount } = useNotifications();
  const draftCount = getDraftItemCount();
  const draftTotal = getDraftSubtotal();
  const { width } = useWindowDimensions();
  const numColumns = width >= 1024 ? 3 : width >= 768 ? 2 : 1;

  // Quantity modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);

  function getCartQuantity(productId: string): number {
    const item = draftItems.find((i) => i.product_id === productId);
    return item?.quantity || 0;
  }

  function openQuantityModal(product: Product) {
    if (product.stock_quantity <= 0) return;
    const currentInCart = getCartQuantity(product.id);
    setSelectedProduct(product);
    setQuantity(currentInCart > 0 ? currentInCart : 1);
  }

  function closeModal() {
    setSelectedProduct(null);
    setQuantity(1);
  }

  function handleAddToOrder() {
    if (!selectedProduct || quantity <= 0) return;
    const currentInCart = getCartQuantity(selectedProduct.id);
    if (currentInCart > 0) {
      updateQuantity(selectedProduct.id, quantity);
    } else {
      addItem(
        {
          id: selectedProduct.id,
          name: selectedProduct.name,
          price: selectedProduct.price,
          stock_quantity: selectedProduct.stock_quantity,
        },
        quantity
      );
    }
    closeModal();
  }

  const today = formatShortDate(new Date().toISOString());

  return (
    <View className="flex-1 bg-gray-50">
      {/* Custom Header */}
      <View
        className="bg-white border-b border-gray-200 px-4 pb-3"
        style={{ paddingTop: Platform.OS === 'ios' ? 54 : 40 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3 flex-row items-center gap-2">
            <Image
              source={require('@/assets/logo.png')}
              style={{ width: 28, height: 28, borderRadius: 6 }}
              resizeMode="contain"
            />
            <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
              GELS
            </Text>
            <Text className="text-xs text-gray-400">{today}</Text>
          </View>
          <View className="flex-row items-center gap-3">
            {/* Notifications button */}
            <TouchableOpacity
              className="relative"
              onPress={() => router.push('/(collector)/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#374151" />
              {unreadCount > 0 && (
                <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[16px] h-[16px] items-center justify-center">
                  <Text className="text-white text-[9px] font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            {/* Order History button */}
            <TouchableOpacity
              onPress={() => router.push('/(collector)/orders')}
            >
              <Ionicons name="receipt-outline" size={22} color="#374151" />
            </TouchableOpacity>
            {/* Profile button */}
            <TouchableOpacity onPress={() => router.push('/(collector)/settings')}>
              <Ionicons name="person-circle-outline" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sticky Search Bar */}
      <View className="bg-white px-4 pt-3 pb-2 border-b border-gray-100">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2.5">
          <Ionicons name="search-outline" size={18} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            value={search}
            onChangeText={setSearch}
            placeholder="Search products..."
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Product Feed */}
      {error ? (
        <View className="px-4 pt-6">
          <Text className="text-red-500 text-center">{error}</Text>
        </View>
      ) : loading && products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-400">Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="cube-outline" size={48} color="#d1d5db" />
          <Text className="text-gray-500 mt-3 text-center">No products found</Text>
          <Text className="text-gray-400 text-sm mt-1 text-center">
            Try adjusting your search
          </Text>
        </View>
      ) : (
        <FlatList
          key={`products-${numColumns}`}
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          contentContainerStyle={{ padding: 12, paddingBottom: draftCount > 0 ? 100 : 40 }}
          columnWrapperStyle={numColumns > 1 ? { gap: 10 } : undefined}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} />
          }
          ListFooterComponent={() =>
            totalPages > 1 ? (
              <View className="flex-row items-center justify-between bg-white mx-3 mb-4 px-4 py-3 rounded-xl border border-gray-100">
                <TouchableOpacity
                  onPress={prevPage}
                  disabled={page === 1}
                  className={page === 1 ? 'opacity-30' : 'opacity-100'}
                >
                  <Text className="text-sm font-medium text-blue-500">← Prev</Text>
                </TouchableOpacity>
                <View className="items-center">
                  <Text className="text-sm font-medium text-gray-700">
                    Page {page} of {totalPages}
                  </Text>
                  <Text className="text-xs text-gray-400">{total} products</Text>
                </View>
                <TouchableOpacity
                  onPress={nextPage}
                  disabled={page >= totalPages}
                  className={page >= totalPages ? 'opacity-30' : 'opacity-100'}
                >
                  <Text className="text-sm font-medium text-blue-500">Next →</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isOutOfStock = item.stock_quantity <= 0;
            const isLowStock = item.stock_quantity > 0 && item.stock_quantity < 10;
            const inCart = getCartQuantity(item.id);

            return (
              <View style={numColumns > 1 ? { flex: 1 } : undefined}>
                <TouchableOpacity
                  className={`bg-white rounded-xl mb-2.5 border overflow-hidden ${
                    isOutOfStock ? 'border-gray-100 opacity-50' : inCart > 0 ? 'border-blue-200' : 'border-gray-100'
                  }`}
                  onPress={() => openQuantityModal(item)}
                  disabled={isOutOfStock}
                  activeOpacity={0.7}
                >
                  {/* Left accent bar */}
                  <View className="flex-row">
                    <View className={`w-1 ${isOutOfStock ? 'bg-gray-200' : inCart > 0 ? 'bg-blue-500' : 'bg-gray-200'}`} />
                    <View className="flex-1 px-3 py-3">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 mr-2">
                          <Text className="text-sm font-bold text-gray-800" numberOfLines={2}>
                            {item.name}
                          </Text>
                          <Text className="text-base font-extrabold text-blue-600 mt-1">
                            {formatCurrency(item.price)}
                          </Text>
                        </View>
                        <View className="items-end gap-1">
                          {inCart > 0 ? (
                            <View className="bg-blue-500 rounded-full w-7 h-7 items-center justify-center">
                              <Text className="text-white text-xs font-bold">{inCart}</Text>
                            </View>
                          ) : (
                            <View className={`rounded-full w-7 h-7 items-center justify-center ${isOutOfStock ? 'bg-gray-100' : 'bg-blue-50'}`}>
                              <Ionicons name="add" size={16} color={isOutOfStock ? '#9ca3af' : '#3b82f6'} />
                            </View>
                          )}
                        </View>
                      </View>
                      <View className="flex-row items-center mt-1.5 gap-2">
                        {isOutOfStock ? (
                          <View className="bg-red-50 rounded-full px-2 py-0.5">
                            <Text className="text-[10px] text-red-500 font-semibold">Out of stock</Text>
                          </View>
                        ) : isLowStock ? (
                          <View className="bg-orange-50 rounded-full px-2 py-0.5">
                            <Text className="text-[10px] text-orange-500 font-semibold">Only {item.stock_quantity} left</Text>
                          </View>
                        ) : (
                          <View className="bg-green-50 rounded-full px-2 py-0.5">
                            <Text className="text-[10px] text-green-600 font-semibold">{item.stock_quantity} in stock</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      {/* Floating Cart Button */}
      {draftCount > 0 && (
        <TouchableOpacity
          className="absolute bottom-6 left-4 right-4 bg-blue-500 rounded-2xl px-5 py-4 flex-row items-center justify-between shadow-lg"
          style={{ elevation: 10 }}
          onPress={() => router.push('/(collector)/cart')}
          activeOpacity={0.9}
        >
          <View className="flex-row items-center gap-3">
            <View className="bg-white/20 rounded-full w-8 h-8 items-center justify-center">
              <Ionicons name="bag-handle" size={18} color="#fff" />
            </View>
            <View>
              <Text className="text-white text-sm font-bold">
                {draftCount} item{draftCount !== 1 ? 's' : ''}
              </Text>
              <Text className="text-white/70 text-xs">Tap to checkout</Text>
            </View>
          </View>
          <Text className="text-white text-lg font-extrabold">
            {formatCurrency(draftTotal)}
          </Text>
        </TouchableOpacity>
      )}

      {/* Quantity Modal */}
      <Modal
        visible={!!selectedProduct}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View className="bg-white rounded-t-3xl px-6 pt-3 pb-10">
              {/* Drag handle */}
              <View className="items-center mb-4">
                <View className="w-10 h-1 bg-gray-200 rounded-full" />
              </View>

              {selectedProduct && (
                <>
                  {/* Product info */}
                  <View className="mb-6">
                    <Text className="text-xl font-bold text-gray-800 mb-1" numberOfLines={2}>
                      {selectedProduct.name}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-2xl font-extrabold text-blue-600">
                        {formatCurrency(selectedProduct.price)}
                      </Text>
                      <View className={`rounded-full px-3 py-1 ${
                        selectedProduct.stock_quantity < 10 ? 'bg-orange-50' : 'bg-green-50'
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          selectedProduct.stock_quantity < 10 ? 'text-orange-500' : 'text-green-600'
                        }`}>
                          {selectedProduct.stock_quantity} available
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Divider */}
                  <View className="h-px bg-gray-100 mb-5" />

                  {/* Quantity label + controls */}
                  <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Quantity
                  </Text>
                  <View className="flex-row items-center justify-between bg-gray-50 rounded-2xl px-4 py-3 mb-5">
                    <TouchableOpacity
                      className="w-12 h-12 rounded-xl bg-white border border-gray-200 items-center justify-center"
                      onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                    >
                      <Ionicons name="remove" size={22} color="#374151" />
                    </TouchableOpacity>

                    <TextInput
                      className="text-3xl font-bold text-center text-gray-800"
                      style={{ minWidth: 72 }}
                      value={quantity.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text, 10);
                        if (!isNaN(num) && num >= 0) {
                          setQuantity(Math.min(num, selectedProduct.stock_quantity));
                        } else if (text === '') {
                          setQuantity(0);
                        }
                      }}
                      keyboardType="number-pad"
                      selectTextOnFocus
                    />

                    <TouchableOpacity
                      className="w-12 h-12 rounded-xl bg-blue-500 items-center justify-center"
                      onPress={() =>
                        setQuantity((q) => Math.min(q + 1, selectedProduct.stock_quantity))
                      }
                      disabled={quantity >= selectedProduct.stock_quantity}
                      activeOpacity={1}
                    >
                      <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Subtotal row */}
                  <View className="flex-row items-center justify-between bg-blue-50 rounded-xl px-4 py-3 mb-5">
                    <Text className="text-sm text-blue-600 font-medium">Subtotal</Text>
                    <Text className="text-lg font-extrabold text-blue-700">
                      {formatCurrency(selectedProduct.price * quantity)}
                    </Text>
                  </View>

                  {/* Add to Order button */}
                  <TouchableOpacity
                    className={`rounded-xl py-4 flex-row items-center justify-center ${
                      quantity > 0 ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                    onPress={handleAddToOrder}
                    disabled={quantity <= 0}
                  >
                    <Text className={`font-bold text-sm text-center ${quantity > 0 ? 'text-white' : 'text-gray-400'}`}>
                      {getCartQuantity(selectedProduct.id) > 0 ? 'Update Order' : 'Add to Order'}
                    </Text>
                  </TouchableOpacity>

                  {/* Cancel */}
                  <TouchableOpacity
                    className="mt-3 py-4 items-center bg-gray-100 rounded-xl"
                    onPress={closeModal}
                  >
                    <Text className="text-gray-500 font-medium text-sm">Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
