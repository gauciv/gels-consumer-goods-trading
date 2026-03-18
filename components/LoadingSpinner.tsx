import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ScaledText';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <View className="flex-1 items-center justify-center bg-[#0D1F33]">
      <ActivityIndicator size="large" color="#5B9BD5" />
      {message && <Text className="mt-4 text-[#8FAABE]">{message}</Text>}
    </View>
  );
}
