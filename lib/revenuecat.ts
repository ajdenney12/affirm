import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';

const ENTITLEMENT_ID = 'nextself_pro';

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

export async function linkRevenueCatUser(userId: string): Promise<void> {
  if (Platform.OS !== 'ios' || !isInitialized) return;

  try {
    await Purchases.logIn(userId);
  } catch (error) {
    // LogIn throws if the user is already logged in with the same ID — safe to ignore
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('already logged in')) {
      // Silently ignore other errors — entitlement checks will handle the fallback
    }
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
