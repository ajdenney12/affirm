import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { supabase } from './supabase';

type SessionEstablishedCallback = () => void;
type RecoveryEstablishedCallback = () => void;

function parseTokenFromUrl(url: string): {
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
} {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { accessToken: null, refreshToken: null, type: null };
  }

  const params = parsed.searchParams;
  const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));

  const accessToken =
    params.get('access_token') || hashParams.get('access_token');
  const refreshToken =
    params.get('refresh_token') || hashParams.get('refresh_token');
  const type = params.get('type') || hashParams.get('type');

  return { accessToken, refreshToken, type };
}

async function handleAuthUrl(
  url: string,
  onSessionEstablished?: SessionEstablishedCallback,
  onRecoveryEstablished?: RecoveryEstablishedCallback
): Promise<void> {
  const { accessToken, refreshToken, type } = parseTokenFromUrl(url);

  if (!accessToken || !refreshToken) {
    return;
  }

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    return;
  }

  if (type === 'recovery' && onRecoveryEstablished) {
    onRecoveryEstablished();
  } else if (onSessionEstablished) {
    onSessionEstablished();
  }
}

export function setupAuthDeepLinkHandler(
  onSessionEstablished?: SessionEstablishedCallback,
  onRecoveryEstablished?: RecoveryEstablishedCallback
): () => void {
  if (Platform.OS === 'web') {
    return () => {};
  }

  Linking.getInitialURL().then((url) => {
    if (url) {
      handleAuthUrl(url, onSessionEstablished, onRecoveryEstablished);
    }
  });

  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleAuthUrl(url, onSessionEstablished, onRecoveryEstablished);
  });

  return () => {
    subscription.remove();
  };
}
