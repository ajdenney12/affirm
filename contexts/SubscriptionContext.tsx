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
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';

export interface AnnualPackageInfo {
  priceString: string;
  localizedPrice: string;
}

interface PurchaseResult {
  success: boolean;
  cancelled: boolean;
  error?: string;
}

interface SubscriptionContextValue {
  isPremium: boolean;
  loading: boolean;
  refreshSubscription: () => Promise<void>;
  purchaseAnnual: () => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
  annualPackage: AnnualPackageInfo | null;
  purchaseLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isPremium: false,
  loading: true,
  refreshSubscription: async () => {},
  purchaseAnnual: async () => ({ success: false, cancelled: false }),
  restorePurchases: async () => ({ success: false, cancelled: false }),
  annualPackage: null,
  purchaseLoading: false,
});

type CustomerInfo = Awaited<ReturnType<typeof Purchases.getCustomerInfo>>;

function checkEntitlement(info: CustomerInfo | undefined | null): boolean {
  return Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
}

function isCancellationError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    const code = (error as { code?: string }).code;
    if (code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) return true;
    if ((error as { userCancelled?: boolean | null }).userCancelled === true) return true;
  }
  return false;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred. Please try again.';
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [annualPackage, setAnnualPackage] = useState<AnnualPackageInfo | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const mountedRef = useRef(true);

  const fetchOfferings = useCallback(async () => {
    if (Platform.OS !== 'ios' || !isRevenueCatInitialized()) return;

    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) return;

      const annual = current.annual;
      if (!annual) return;

      const product = annual.product;
      if (mountedRef.current) {
        setAnnualPackage({
          priceString: product.priceString,
          localizedPrice: product.priceString,
        });
      }
    } catch {
      // Offerings fetch failed — paywall will fall back to default price display
    }
  }, []);

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

  const purchaseAnnual = useCallback(async (): Promise<PurchaseResult> => {
    if (Platform.OS !== 'ios' || !isRevenueCatInitialized()) {
      return { success: false, cancelled: false, error: 'In-app purchases are not available on this device.' };
    }

    setPurchaseLoading(true);

    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (!current) {
        return { success: false, cancelled: false, error: 'No offerings are currently available. Please try again later.' };
      }

      const annual = current.annual;
      if (!annual) {
        return { success: false, cancelled: false, error: 'The annual plan is not available. Please try again later.' };
      }

      const result = await Purchases.purchasePackage(annual);
      const isNowPremium = checkEntitlement(result.customerInfo);

      if (mountedRef.current) {
        setIsPremium(isNowPremium);
      }

      return { success: isNowPremium, cancelled: false };
    } catch (error) {
      if (isCancellationError(error)) {
        return { success: false, cancelled: true };
      }

      if (mountedRef.current) {
        setIsPremium(false);
      }
      return { success: false, cancelled: false, error: extractErrorMessage(error) };
    } finally {
      if (mountedRef.current) {
        setPurchaseLoading(false);
      }
    }
  }, []);

  const restorePurchases = useCallback(async (): Promise<PurchaseResult> => {
    if (Platform.OS !== 'ios' || !isRevenueCatInitialized()) {
      return { success: false, cancelled: false, error: 'In-app purchases are not available on this device.' };
    }

    setPurchaseLoading(true);

    try {
      const info = await Purchases.restorePurchases();
      const isNowPremium = checkEntitlement(info);

      if (mountedRef.current) {
        setIsPremium(isNowPremium);
      }

      if (!isNowPremium) {
        return { success: false, cancelled: false, error: 'No previous purchases were found to restore.' };
      }

      return { success: true, cancelled: false };
    } catch (error) {
      if (mountedRef.current) {
        setIsPremium(false);
      }
      return { success: false, cancelled: false, error: extractErrorMessage(error) };
    } finally {
      if (mountedRef.current) {
        setPurchaseLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    refreshSubscription();
    fetchOfferings();

    let listener: ((info: CustomerInfo) => void) | null = null;

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
        fetchOfferings();
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
  }, [refreshSubscription, fetchOfferings]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        loading,
        refreshSubscription,
        purchaseAnnual,
        restorePurchases,
        annualPackage,
        purchaseLoading,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
