import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

export default function RootLayout() {
  useFrameworkReady();
  return (
    <SubscriptionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </SubscriptionProvider>
  );
}
