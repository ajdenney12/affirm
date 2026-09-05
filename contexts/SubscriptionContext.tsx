import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { supabase } from '../lib/supabase';

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

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const refreshSubscription = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (mountedRef.current) {
          setIsPremium(false);
          setLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('is_premium')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        if (mountedRef.current) {
          setIsPremium(false);
          setLoading(false);
        }
        return;
      }

      if (mountedRef.current) {
        setIsPremium(Boolean(data?.is_premium));
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
