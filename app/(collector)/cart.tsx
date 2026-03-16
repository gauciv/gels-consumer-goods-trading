import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/lib/cart';
import { useOrderSubmit } from '@/hooks/useOrderSubmit';
import { useStores } from '@/hooks/useStores';
import { StoreSelector } from '@/components/StoreSelector';
import { formatCurrency } from '@/lib/formatters';
import { createStore, updateStore, deleteStore, getTopStores } from '@/services/stores.service';
import type { Store } from '@/types';

export default function CartScreen() {
  const {
    draftItems,
    removeDraftItem,
    updateDraftQuantity,
    getDraftSubtotal,
    getDraftItemCount,
    clearDraft,
    markStoreSubmitted,
  } = useCart();

  const { submitOrderForStore, isLoadingStore, getStoreError } = useOrderSubmit();
  const { stores, loading: storesLoading, refetch: refetchStores } = useStores();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [showStoreModal, setShowStoreModal] = useState(false);
  const [creatingStore, setCreatingStore] = useState(false);
  const [selectedStore, setSelectedStore] = useState<{ id: string; name: string } | null>(null);
  const [notes, setNotes] = useState('');
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingStoreId, setRenamingStoreId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [emptySubmitShake, setEmptySubmitShake] = useState(false);

  const draftCount = getDraftItemCount();
  const draftSubtotal = getDraftSubtotal();
  const isSubmitting = selectedStore ? isLoadingStore(selectedStore.id) : false;
  const submitError = selectedStore ? getStoreError(selectedStore.id) : null;

  async function handleAddCustomStore(name: string) {
    setCreatingStore(true);
    try {
      const store = await createStore(name);
      setSelectedStore({ id: store.id, name: store.name });
      setShowStoreModal(false);
      refetchStores();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not create store');
    } finally {
      setCreatingStore(false);
    }
  }

  async function handleSubmit() {
    if (draftItems.length === 0) {
      setEmptySubmitShake(true);
      setTimeout(() => setEmptySubmitShake(false), 600);
      Alert.alert('No Products', 'Please add at least one product to your order before submitting.');
      return;
    }
    if (!selectedStore) {
      Alert.alert('Store Required', 'Please select a store before submitting your order.');
      return;
    }

    const result = await submitOrderForStore(selectedStore.id, draftItems, notes || undefined);
    if (result) {
      markStoreSubmitted(selectedStore.id, selectedStore.name, draftCount, draftSubtotal, draftItems);
      clearDraft();
      setSelectedStore(null);
      setNotes('');
      router.replace('/(collector)/confirmation');
    }
  }

  async function handleRenameStore(storeId: string) {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    try {
      await updateStore(storeId, { name: trimmed });
      if (selectedStore?.id === storeId) {
        setSelectedStore({ id: storeId, name: trimmed });
      }
      refetchStores();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not rename store');
    } finally {
      setRenamingStoreId(null);
      setRenameValue('');
    }
  }

  function handleDeleteStore(storeId: string, storeName: string) {
    setMenuOpenId(null);
    Alert.alert(
      'Delete Store',
      `Delete "${storeName}" permanently?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStore(storeId);
              if (selectedStore?.id === storeId) setSelectedStore(null);
              refetchStores();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete store. It may have associated orders.');
            }
          },
        },
      ]
    );
  }

  // Empty state - no items in cart
  if (draftItems.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-4">
        <Ionicons name="bag-outline" size={48} color="#d1d5db" />
        <Text className="text-gray-500 text-lg font-medium mt-4">Your cart is empty</Text>
        <Text className="text-gray-400 text-sm mt-1 text-center">
          Browse products and add items to start your order
        </Text>
        <TouchableOpacity
          className="mt-6 bg-blue-500 rounded-lg px-8 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Browse Products</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{
          padding: 12,
          paddingBottom: 140,
          ...(isTablet ? { maxWidth: 640, alignSelf: 'center' as const, width: '100%' } : {}),
        }}
      >
        {/* Section: Order Items */}
        <Text className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
          Order Items ({draftCount})
        </Text>
        <View className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
          {draftItems.map((item, index) => (
            <View
              key={item.product_id}
              className={`px-4 py-3 ${index < draftItems.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-gray-800">
                    {item.product_name}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-0.5">
                    {formatCurrency(item.unit_price)} × {item.quantity}
                  </Text>
                </View>
                <Text className="text-sm font-bold text-gray-800">
                  {formatCurrency(item.line_total)}
                </Text>
              </View>

              {/* Quantity controls */}
              <View className="flex-row items-center mt-2">
                <TouchableOpacity
                  className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
                  onPress={() => {
                    if (item.quantity <= 1) {
                      removeDraftItem(item.product_id);
                    } else {
                      updateDraftQuantity(item.product_id, item.quantity - 1);
                    }
                  }}
                >
                  <Ionicons
                    name={item.quantity <= 1 ? 'trash-outline' : 'remove'}
                    size={14}
                    color={item.quantity <= 1 ? '#ef4444' : '#374151'}
                  />
                </TouchableOpacity>
                <Text className="mx-3 text-sm font-medium text-gray-700 min-w-[20px] text-center">
                  {item.quantity}
                </Text>
                <TouchableOpacity
                  className="w-7 h-7 rounded-full bg-gray-100 items-center justify-center"
                  onPress={() => updateDraftQuantity(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock_quantity}
                >
                  <Ionicons
                    name="add"
                    size={14}
                    color={item.quantity >= item.stock_quantity ? '#d1d5db' : '#374151'}
                  />
                </TouchableOpacity>
                <View className="flex-1" />
                <TouchableOpacity onPress={() => removeDraftItem(item.product_id)}>
                  <Ionicons name="close-circle-outline" size={18} color="#9ca3af" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Subtotal */}
          <View className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-row justify-between items-center">
            <Text className="text-sm font-bold text-gray-700">Subtotal</Text>
            <Text className="text-base font-bold text-blue-600">
              {formatCurrency(draftSubtotal)}
            </Text>
          </View>
        </View>

        {/* Add more products */}
        <TouchableOpacity
          className="flex-row items-center justify-center gap-1.5 py-2.5 mb-4"
          onPress={() => router.back()}
        >
          <Ionicons name="add-circle-outline" size={16} color="#3b82f6" />
          <Text className="text-sm font-medium text-blue-500">Add more products</Text>
        </TouchableOpacity>

        {/* Section: Select Store */}
        <Text className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
          Store <Text className="text-red-400">*</Text>
        </Text>
        {selectedStore ? (
          <View className="bg-white rounded-xl border border-blue-200 overflow-hidden mb-4">
            <View className="flex-row items-center justify-between px-4 py-3">
              <View className="flex-row items-center gap-2.5 flex-1">
                <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center">
                  <Ionicons name="storefront" size={16} color="#3b82f6" />
                </View>
                {renamingStoreId === selectedStore.id ? (
                  <View className="flex-row items-center flex-1 gap-1.5">
                    <TextInput
                      className="flex-1 bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 text-sm text-gray-800"
                      value={renameValue}
                      onChangeText={setRenameValue}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={() => handleRenameStore(selectedStore.id)}
                      onBlur={() => { setRenamingStoreId(null); setRenameValue(''); }}
                    />
                    <TouchableOpacity onPress={() => handleRenameStore(selectedStore.id)} className="p-1">
                      <Ionicons name="checkmark-circle" size={22} color="#3b82f6" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text className="text-sm font-bold text-gray-800 flex-1" numberOfLines={1}>
                    {selectedStore.name}
                  </Text>
                )}
              </View>
              {renamingStoreId !== selectedStore.id && (
                <View className="flex-row items-center gap-1">
                  <View className="relative">
                    <TouchableOpacity
                      onPress={() => setMenuOpenId(menuOpenId === selectedStore.id ? null : selectedStore.id)}
                      className="p-1.5"
                    >
                      <Ionicons name="ellipsis-vertical" size={18} color="#9ca3af" />
                    </TouchableOpacity>
                    {menuOpenId === selectedStore.id && (
                      <View className="absolute right-0 top-9 bg-white rounded-xl border border-gray-200 shadow-lg z-50 w-40 overflow-hidden" style={{ elevation: 8 }}>
                        <TouchableOpacity
                          className="flex-row items-center gap-2.5 px-4 py-3 border-b border-gray-100"
                          onPress={() => {
                            setMenuOpenId(null);
                            setRenameValue(selectedStore.name);
                            setRenamingStoreId(selectedStore.id);
                          }}
                        >
                          <Ionicons name="pencil-outline" size={16} color="#374151" />
                          <Text className="text-sm text-gray-700">Rename</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="flex-row items-center gap-2.5 px-4 py-3"
                          onPress={() => handleDeleteStore(selectedStore.id, selectedStore.name)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          <Text className="text-sm text-red-500">Delete Store</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedStore(null)}
                    className="p-1.5"
                  >
                    <Ionicons name="close-circle" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity
            className="bg-white rounded-xl border border-dashed border-gray-300 px-4 py-4 flex-row items-center justify-center gap-2 mb-4"
            onPress={() => setShowStoreModal(true)}
          >
            <Ionicons name="storefront-outline" size={18} color="#9ca3af" />
            <Text className="text-sm text-gray-500 font-medium">Select a store</Text>
          </TouchableOpacity>
        )}

        {/* Notes */}
        <Text className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
          Notes (optional)
        </Text>
        <TextInput
          className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-800 mb-4"
          value={notes}
          onChangeText={setNotes}
          placeholder="Add notes for this order..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 72 }}
        />

        {/* Error */}
        {submitError && (
          <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <Text className="text-red-600 text-xs text-center">{submitError}</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom: Submit button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4" style={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm text-gray-600">Total</Text>
          <Text className="text-xl font-extrabold text-blue-600">
            {formatCurrency(draftSubtotal)}
          </Text>
        </View>
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            isSubmitting ? 'bg-green-400' : !selectedStore ? 'bg-gray-300' : 'bg-green-500'
          }`}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white text-sm font-bold">Submitting...</Text>
            </View>
          ) : (
            <Text className="text-white text-sm font-bold">
              {!selectedStore ? 'Select a store to submit' : 'Submit Order'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Store Picker Modal */}
      <StorePickerModal
        visible={showStoreModal}
        onClose={() => setShowStoreModal(false)}
        stores={stores.filter((s) => s.is_active)}
        loading={storesLoading}
        creatingCustom={creatingStore}
        onSelect={(store) => {
          setSelectedStore({ id: store.id, name: store.name });
          setShowStoreModal(false);
        }}
        onAddCustom={handleAddCustomStore}
      />
    </View>
  );
}

function StorePickerModal({
  visible,
  onClose,
  stores,
  loading,
  onSelect,
  onAddCustom,
  creatingCustom,
}: {
  visible: boolean;
  onClose: () => void;
  stores: Store[];
  loading: boolean;
  onSelect: (store: Store) => void;
  onAddCustom: (name: string) => void;
  creatingCustom?: boolean;
}) {
  const [newName, setNewName] = useState('');
  const [query, setQuery] = useState('');
  const [topStores, setTopStores] = useState<{ store_id: string; store_name: string; order_count: number }[]>([]);
  const [topLoading, setTopLoading] = useState(false);

  // Fetch top stores when modal opens
  React.useEffect(() => {
    if (!visible) return;
    setTopLoading(true);
    getTopStores(5)
      .then(setTopStores)
      .catch(() => setTopStores([]))
      .finally(() => setTopLoading(false));
  }, [visible]);

  const trimmedNew = newName.trim();
  const filtered = query.trim()
    ? stores.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
    : stores;

  function handleClose() {
    setNewName('');
    setQuery('');
    onClose();
  }

  function handleSelect(store: Store) {
    setNewName('');
    setQuery('');
    onSelect(store);
  }

  function handleTopStoreSelect(storeId: string, storeName: string) {
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      handleSelect(store);
    } else {
      // Store exists in orders but may not be in the active stores list
      onSelect({ id: storeId, name: storeName } as Store);
      setNewName('');
      setQuery('');
    }
  }

  function handleAdd() {
    if (!trimmedNew) return;
    onAddCustom(trimmedNew);
    setNewName('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity
        className="flex-1 bg-black/40 justify-end"
        activeOpacity={1}
        onPress={handleClose}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View className="bg-white rounded-t-2xl px-5 pt-5 pb-10">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-base font-bold text-gray-800">Select Store</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={22} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Top Stores - quick shortcut */}
            {!topLoading && topStores.length > 0 && !query.trim() && (
              <View className="mb-4">
                <Text className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">
                  Top Stores
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {topStores.map((ts) => (
                    <TouchableOpacity
                      key={ts.store_id}
                      className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex-row items-center gap-1.5"
                      onPress={() => handleTopStoreSelect(ts.store_id, ts.store_name)}
                    >
                      <Ionicons name="star" size={12} color="#3b82f6" />
                      <Text className="text-xs font-semibold text-blue-700" numberOfLines={1}>
                        {ts.store_name}
                      </Text>
                      <Text className="text-[10px] text-blue-400">
                        ({ts.order_count})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Create new store */}
            <View className="flex-row items-center gap-2 mb-5">
              <Text className="text-sm font-semibold text-gray-600 shrink-0">New Store</Text>
              <TextInput
                className="flex-1 bg-gray-100 rounded-lg px-3 py-2.5 text-sm text-gray-800"
                value={newName}
                onChangeText={setNewName}
                placeholder="Enter store name"
                placeholderTextColor="#9ca3af"
                returnKeyType="done"
                onSubmitEditing={handleAdd}
              />
              <TouchableOpacity
                className={`rounded-lg px-4 py-2.5 items-center justify-center ${
                  !trimmedNew || creatingCustom ? 'bg-blue-300' : 'bg-blue-500'
                }`}
                onPress={handleAdd}
                disabled={!trimmedNew || creatingCustom}
              >
                {creatingCustom ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-sm font-bold">Add</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="flex-row items-center gap-3 mb-4">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="text-xs text-gray-400 font-medium">or select existing</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Search existing */}
            {loading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="text-gray-400 text-sm mt-2">Loading stores...</Text>
              </View>
            ) : (
              <>
                <TextInput
                  className="bg-gray-100 rounded-lg px-3 py-2.5 text-sm text-gray-800 mb-3"
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search stores..."
                  placeholderTextColor="#9ca3af"
                  clearButtonMode="while-editing"
                />
                {filtered.length > 0 ? (
                  <StoreSelector stores={filtered} selectedId={null} onSelect={handleSelect} />
                ) : (
                  <View className="py-4 items-center">
                    <Text className="text-gray-400 text-sm">No stores found</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
