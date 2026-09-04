import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { setupAuthDeepLinkHandler } from '../lib/auth-deep-link';

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isRecoverySession = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isRecoverySession) {
        isRecoverySession = false;
        if (session) {
          router.replace('/(auth)/reset-password');
        } else {
          router.replace('/(auth)/login');
        }
        return;
      }

      if (session) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    });

    const cleanupDeepLink = setupAuthDeepLinkHandler(
      undefined,
      () => {
        isRecoverySession = true;
        router.replace('/(auth)/reset-password');
      }
    );

    return () => {
      subscription.unsubscribe();
      cleanupDeepLink();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return null;
}
