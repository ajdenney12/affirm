import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';

const ENTITLEMENT_ID = 'nextself_pro';

type CustomerInfo = Awaited<ReturnType<typeof Purchases.getCustomerInfo>>;

let isInitialized = false;

function getApiKey(): string | null {
  const key = Constants.expoConfig?.extra?.revenuecatApiKey as string | undefined;
  if (!key) {
    return null;
  }
  return key;
}

export async function initRevenueCat(): Promise<void> {
  if (isInitialized) return;

  if (Platform.OS !== 'ios') {
    return;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return;
  }

  try {
    await Purchases.configure({ apiKey });
    isInitialized = true;
  } catch (error) {
    isInitialized = false;
  }
}

export async function linkRevenueCatUser(userId: string): Promise<CustomerInfo | null> {
  if (Platform.OS !== 'ios' || !isInitialized) return null;

  try {
    const result = await Purchases.logIn(userId);
    return result.customerInfo;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('already logged in')) {
      try {
        return await Purchases.getCustomerInfo();
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function logoutRevenueCatUser(): Promise<void> {
  if (Platform.OS !== 'ios' || !isInitialized) return;

  try {
    await Purchases.logOut();
  } catch {
    // If logOut fails, the next logIn will re-associate the correct user
  }
}

export function isRevenueCatInitialized(): boolean {
  return isInitialized;
}

export { ENTITLEMENT_ID };
