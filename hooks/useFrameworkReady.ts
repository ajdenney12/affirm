import { useEffect } from 'react';
import { Platform } from 'react-native';

declare global {
  interface Window {
    frameworkReady?: () => void;
  }
}

export function useFrameworkReady() {
  useEffect(() => {
    if (Platform.OS === 'web' && typeof globalThis !== 'undefined' && 'window' in globalThis) {
      (globalThis as typeof globalThis & { window: Window }).window.frameworkReady?.();
    }
  }, []);
}