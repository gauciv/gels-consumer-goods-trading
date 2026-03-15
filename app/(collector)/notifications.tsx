import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types';

function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(dateString)
  );
}

function groupByDay(items: Notification[]): { label: string; items: Notification[] }[] {
  const groups: Record<string, Notification[]> = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const n of items) {
    const d = new Date(n.created_at).toDateString();
    const label =
      d === today
        ? 'Today'
        : d === yesterday
        ? 'Yesterday'
        : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
            new Date(n.created_at)
          );
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

type IconConfig = { name: React.ComponentProps<typeof Ionicons>['name']; bg: string; color: string };

function iconFor(type: NotificationType): IconConfig {
  switch (type) {
    case 'order_status_changed':
      return { name: 'receipt-outline',     bg: 'bg-blue-50',   color: '#3b82f6' };
    case 'low_stock':
      return { name: 'warning-outline',     bg: 'bg-orange-50', color: '#f97316' };
    case 'out_of_stock':
      return { name: 'close-circle-outline', bg: 'bg-red-50',   color: '#ef4444' };
    case 'price_changed':
      return { name: 'pricetag-outline',    bg: 'bg-purple-50', color: '#a855f7' };
    case 'new_product':
      return { name: 'sparkles-outline',    bg: 'bg-green-50',  color: '#22c55e' };
  }
}

function NotificationRow({
  item,
  onPress,
}: {
  item: Notification;
  onPress: (id: string) => void;
}) {
  const icon = iconFor(item.type);
  return (
    <TouchableOpacity
      className={`flex-row items-start px-4 py-3 ${!item.is_read ? 'bg-blue-50/40' : 'bg-white'}`}
      onPress={() => { if (!item.is_read) onPress(item.id); }}
      activeOpacity={0.7}
    >
      {/* Unread dot */}
      <View className="w-2 mt-2 mr-2 items-center">
        {!item.is_read && <View className="w-2 h-2 rounded-full bg-blue-500" />}
      </View>

      {/* Type icon */}
      <View className={`w-9 h-9 rounded-full ${icon.bg} items-center justify-center mr-3 mt-0.5`}>
        <Ionicons name={icon.name} size={18} color={icon.color} />
      </View>

      {/* Text */}
      <View className="flex-1">
        <Text
          className={`text-sm ${!item.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text className="text-xs text-gray-500 mt-0.5 leading-4" numberOfLines={2}>
          {item.body}
        </Text>
        <Text className="text-[11px] text-gray-400 mt-1">{relativeTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-4">
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="notifications-outline" size={32} color="#d1d5db" />
        </View>
        <Text className="text-gray-600 text-base font-semibold">No notifications yet</Text>
        <Text className="text-gray-400 text-sm mt-1 text-center">
          You'll be notified about order updates, stock changes, and price changes.
        </Text>
      </View>
    );
  }

  const groups = groupByDay(notifications);

  return (
    <View className="flex-1 bg-gray-50">
      {unreadCount > 0 && (
        <View className="flex-row items-center justify-between px-4 py-2.5 bg-white border-b border-gray-100">
          <Text className="text-xs text-gray-500">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={markAllAsRead}>
            <Text className="text-xs text-blue-600 font-semibold">Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {groups.map(({ label, items }) => (
          <View key={label}>
            <View className="px-4 pt-4 pb-1">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {label}
              </Text>
            </View>
            <View className="bg-white border-y border-gray-100 overflow-hidden">
              {items.map((item, index) => (
                <View key={item.id}>
                  <NotificationRow item={item} onPress={markAsRead} />
                  {index < items.length - 1 && <View className="h-px bg-gray-100 ml-14" />}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
