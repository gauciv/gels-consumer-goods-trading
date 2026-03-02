import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationBellProps {
  onPress?: () => void;
}

export function NotificationBell({ onPress }: NotificationBellProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  // Mock notifications - replace with actual data from your backend
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'New Order Received',
      message: 'Order #12345 has been successfully processed',
      time: '2 min ago',
      read: false,
      type: 'success',
    },
    {
      id: '2',
      title: 'Low Stock Alert',
      message: 'Product "Coffee Beans" is running low on stock',
      time: '15 min ago',
      read: false,
      type: 'warning',
    },
    {
      id: '3',
      title: 'System Update',
      message: 'POS system has been updated to version 2.1',
      time: '1 hour ago',
      read: true,
      type: 'info',
    },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handlePress = () => {
    setShowNotifications(true);
    onPress?.();
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'warning':
        return '#f59e0b';
      case 'error':
        return '#ef4444';
      default:
        return '#3b82f6';
    }
  };

  return (
    <>
      <TouchableOpacity onPress={handlePress} className="relative">
        <Ionicons name="notifications-outline" size={24} color="#374151" />
        {unreadCount > 0 && (
          <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
            <Text className="text-white text-[10px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40"
          activeOpacity={1}
          onPress={() => setShowNotifications(false)}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => {}}
            className={`bg-white rounded-t-2xl mt-auto ${isTablet ? 'mx-auto max-w-lg w-full' : ''}`}
          >
            <View className="px-6 pt-6 pb-4">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-800">Notifications</Text>
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={markAllAsRead}>
                    <Text className="text-blue-500 text-sm font-medium">Mark all as read</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Notifications List */}
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 400 }}
                ListEmptyComponent={
                  <View className="items-center py-8">
                    <Ionicons name="notifications-off-outline" size={48} color="#d1d5db" />
                    <Text className="text-gray-500 mt-3">No notifications</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className={`py-3 border-b border-gray-100 ${!item.read ? 'bg-blue-50' : ''}`}
                    onPress={() => markAsRead(item.id)}
                  >
                    <View className="flex-row">
                      <View className="mr-3">
                        <Ionicons 
                          name={getNotificationIcon(item.type)} 
                          size={20} 
                          color={getNotificationColor(item.type)} 
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-start justify-between">
                          <Text className={`text-sm font-semibold text-gray-800 flex-1 ${!item.read ? 'font-bold' : ''}`}>
                            {item.title}
                          </Text>
                          {!item.read && (
                            <View className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1" />
                          )}
                        </View>
                        <Text className="text-xs text-gray-600 mt-1">{item.message}</Text>
                        <Text className="text-xs text-gray-400 mt-1">{item.time}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )}
              />

              {/* Close Button */}
              <TouchableOpacity
                className="mt-4 py-3 items-center bg-gray-100 rounded-xl"
                onPress={() => setShowNotifications(false)}
              >
                <Text className="text-gray-700 font-medium">Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
