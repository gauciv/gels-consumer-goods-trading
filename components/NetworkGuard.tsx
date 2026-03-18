import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const isConnected = useNetworkStatus();

  return (
    <>
      {!isConnected && (
        <View className="bg-[#E06C75]/10 flex-row items-center justify-center gap-1.5 py-1.5 px-4">
          <Ionicons name="cloud-offline-outline" size={14} color="#E06C75" />
          <Text className="text-[11px] text-[#E06C75] font-semibold">No Internet Connection</Text>
        </View>
      )}
      {children}
    </>
  );
}
