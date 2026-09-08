import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import {
  isRevenueCatInitialized,
  ENTITLEMENT_ID,
} from '../lib/revenuecat';
import Purchases from 'react-native-purchases';

interface SubscriptionContextValue {
  isPremium: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isPremium: false,
  loading: true,
  refreshSubscription: async () => {},
});

function checkEntitlement(info: Awaited<ReturnType<typeof Purchases.getCustomerInfo>>): boolean {
  return Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refreshSubscription = useCallback(async () => {
    if (Platform.OS !== 'ios' || !isRevenueCatInitialized()) {
      if (mountedRef.current) {
        setIsPremium(false);
        setLoading(false);
      }
      return;
    }

    try {
      const info = await Purchases.getCustomerInfo();
      if (mountedRef.current) {
        setIsPremium(checkEntitlement(info));
        setLoading(false);
      }
    } catch {
      if (mountedRef.current) {
        setIsPremium(false);
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    refreshSubscription();

    let listener: ((info: Awaited<ReturnType<typeof Purchases.getCustomerInfo>>) => void) | null = null;

    if (Platform.OS === 'ios' && isRevenueCatInitialized()) {
      try {
        listener = (info) => {
          if (mountedRef.current) {
            setIsPremium(checkEntitlement(info));
            setLoading(false);
          }
        };
        Purchases.addCustomerInfoUpdateListener(listener);
      } catch {
        // Listener registration failed — refreshSubscription still works manually
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        refreshSubscription();
      } else {
        if (mountedRef.current) {
          setIsPremium(false);
          setLoading(false);
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      if (listener) {
        try {
          Purchases.removeCustomerInfoUpdateListener(listener);
        } catch {
          // Best-effort cleanup
        }
      }
    };
  }, [refreshSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{ isPremium, loading, refreshSubscription }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
