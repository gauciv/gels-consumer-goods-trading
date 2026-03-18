import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProducts } from '@/services/products.service';
import { getStores } from '@/services/stores.service';
import { getOrders } from '@/services/orders.service';
import { getNotifications } from '@/services/notifications.service';
import type { Product, Store, Order, Notification } from '@/types';

const CACHE_PRODUCTS_KEY = 'offline_cache_products';
const CACHE_STORES_KEY = 'offline_cache_stores';
const CACHE_ORDERS_KEY = 'offline_cache_orders';
const CACHE_NOTIFICATIONS_KEY = 'offline_cache_notifications';
const CACHE_TIMESTAMP_KEY = 'offline_cache_timestamp';

export async function downloadAllDataForOffline(): Promise<void> {
  try {
    const [productsResult, stores, ordersResult, notifications] = await Promise.all([
      getProducts({ page: 1, page_size: 10000 }),
      getStores(),
      getOrders({ page: 1, page_size: 200, sort_by: 'newest' }),
      getNotifications(),
    ]);

    await Promise.all([
      AsyncStorage.setItem(CACHE_PRODUCTS_KEY, JSON.stringify(productsResult.data)),
      AsyncStorage.setItem(CACHE_STORES_KEY, JSON.stringify(stores)),
      AsyncStorage.setItem(CACHE_ORDERS_KEY, JSON.stringify(ordersResult.data)),
      AsyncStorage.setItem(CACHE_NOTIFICATIONS_KEY, JSON.stringify(notifications)),
      AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().toISOString()),
    ]);
  } catch (err) {
    console.warn('Failed to cache data for offline:', err);
  }
}

export async function getCachedProducts(): Promise<Product[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw) as Product[];
  } catch {}
  return null;
}

export async function getCachedStores(): Promise<Store[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_STORES_KEY);
    if (raw) return JSON.parse(raw) as Store[];
  } catch {}
  return null;
}

export async function getCachedOrders(): Promise<Order[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_ORDERS_KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch {}
  return null;
}

export async function getCachedNotifications(): Promise<Notification[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_NOTIFICATIONS_KEY);
    if (raw) return JSON.parse(raw) as Notification[];
  } catch {}
  return null;
}

export async function cacheProducts(products: Product[]): Promise<void> {
  try { await AsyncStorage.setItem(CACHE_PRODUCTS_KEY, JSON.stringify(products)); } catch {}
}

export async function cacheStores(stores: Store[]): Promise<void> {
  try { await AsyncStorage.setItem(CACHE_STORES_KEY, JSON.stringify(stores)); } catch {}
}

export async function cacheOrders(orders: Order[]): Promise<void> {
  try { await AsyncStorage.setItem(CACHE_ORDERS_KEY, JSON.stringify(orders)); } catch {}
}

export async function cacheNotifications(notifications: Notification[]): Promise<void> {
  try { await AsyncStorage.setItem(CACHE_NOTIFICATIONS_KEY, JSON.stringify(notifications)); } catch {}
}
