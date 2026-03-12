import { View, Text, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Notifications',
        }} 
      />
      
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Content */}
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center text-lg">
              No notifications yet
            </Text>
            <Text className="text-gray-400 text-sm mt-2 text-center px-8">
              You'll see your notifications here when they become available
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
