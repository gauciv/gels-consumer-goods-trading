import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const isConnected = useNetworkStatus();

  if (!isConnected) {
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <Text className="text-6xl mb-4">!</Text>
        <Text className="text-xl font-bold text-gray-800 mb-2">No Internet Connection</Text>
        <Text className="text-gray-500 text-center mb-6">
          Please check your network connection and try again.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}
