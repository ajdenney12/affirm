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
  initRevenueCat,
  linkRevenueCatUser,
  logoutRevenueCatUser,
  isRevenueCatInitialized,
  ENTITLEMENT_ID,
} from '../lib/revenuecat';
import Purchases from 'react-native-purchases';
import { PURCHASES_ERROR_CODE } from 'react-native-purchases';

export interface AnnualPackageInfo {
  priceString: string;
  localizedPrice: string;
  productId: string;
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
  trialEligible: boolean | null;
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  isPremium: false,
  loading: true,
  refreshSubscription: async () => {},
  purchaseAnnual: async () => ({ success: false, cancelled: false }),
  restorePurchases: async () => ({ success: false, cancelled: false }),
  annualPackage: null,
  purchaseLoading: false,
  trialEligible: null,
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
  const [trialEligible, setTrialEligible] = useState<boolean | null>(null);
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
      const productId = product.identifier;

      if (mountedRef.current) {
        setAnnualPackage({
          priceString: product.priceString,
          localizedPrice: product.priceString,
          productId,
        });
      }

      try {
        const eligibilityMap =
          await Purchases.checkTrialOrIntroductoryPriceEligibility([productId]);
        const eligibility = eligibilityMap[productId];
        if (mountedRef.current) {
          if (eligibility?.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE) {
            setTrialEligible(true);
          } else if (eligibility?.status === Purchases.INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE) {
            setTrialEligible(false);
          } else {
            setTrialEligible(null);
          }
        }
      } catch {
        if (mountedRef.current) {
          setTrialEligible(null);
        }
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

    let listener: ((info: CustomerInfo) => void) | null = null;
    let authUnsubscribe: (() => void) | null = null;

    (async () => {
      await initRevenueCat();

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
          // Listener registration failed — manual refresh still works
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!mountedRef.current) return;

      if (session?.user?.id) {
        const info = await linkRevenueCatUser(session.user.id);
        if (mountedRef.current) {
          setIsPremium(checkEntitlement(info));
          setLoading(false);
        }
      } else if (mountedRef.current) {
        setLoading(false);
      }

      fetchOfferings();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, authSession) => {
          if (authSession?.user?.id) {
            const info = await linkRevenueCatUser(authSession.user.id);
            if (mountedRef.current) {
              setIsPremium(checkEntitlement(info));
              setLoading(false);
            }
            fetchOfferings();
          } else {
            await logoutRevenueCatUser();
            if (mountedRef.current) {
              setIsPremium(false);
              setLoading(false);
            }
          }
        }
      );
      authUnsubscribe = () => subscription.unsubscribe();
    })();

    return () => {
      mountedRef.current = false;
      if (authUnsubscribe) authUnsubscribe();
      if (listener) {
        try {
          Purchases.removeCustomerInfoUpdateListener(listener);
        } catch {
          // Best-effort cleanup
        }
      }
    };
  }, [fetchOfferings]);

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
        trialEligible,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
