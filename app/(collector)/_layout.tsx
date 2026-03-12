import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useEffect } from 'react';
import { useCart } from '@/lib/cart';

export default function CollectorLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { setStore } = useCart();

  // Auto-set store from user's branch
  useEffect(() => {
    if (user?.branch_id && user?.branch_name) {
      setStore(user.branch_id, user.branch_name);
    }
  }, [user?.branch_id, user?.branch_name, setStore]);

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (user?.role !== 'collector') {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#3b82f6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="products" options={{ headerShown: false }} />
      <Stack.Screen name="cart" options={{ title: 'Order Summary' }} />
      <Stack.Screen name="confirmation" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ title: 'Order History' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="settings" options={{ title: 'Profile' }} />
    </Stack>
  );
}
