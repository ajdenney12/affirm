import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabase';
import { initRevenueCat, linkRevenueCatUser, logoutRevenueCatUser } from '@/lib/revenuecat';

export default function RootLayout() {
  useFrameworkReady();
  const initRanRef = useRef(false);

  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    let cancelled = false;

    (async () => {
      await initRevenueCat();

      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session?.user?.id) {
        await linkRevenueCatUser(session.user.id);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, authSession) => {
          if (authSession?.user?.id) {
            await linkRevenueCatUser(authSession.user.id);
          } else {
            await logoutRevenueCatUser();
          }
        }
      );

      return () => subscription.unsubscribe();
    })();
  }, []);

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
