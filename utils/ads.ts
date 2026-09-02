import { isRunningInExpoGo } from 'expo';

type AdsModule = typeof import('react-native-google-mobile-ads');

/**
 * react-native-google-mobile-ads resolves its native TurboModule with
 * `TurboModuleRegistry.getEnforcing(...)` at *import* time, which throws when
 * the native binary isn't there — i.e. in Expo Go. Since SDK 55 dropped the
 * legacy architecture there's no lazy NativeModules proxy to soften that any
 * more, so the module has to be required behind a runtime check rather than
 * imported at the top of a file (mirrors the MMKV fallback in utils/storage.ts).
 *
 * Returns `null` in Expo Go — callers render/do nothing. Ads are non-essential.
 */
let cached: AdsModule | null | undefined;

export function getAdsModule(): AdsModule | null {
  if (cached === undefined) {
    try {
      cached = isRunningInExpoGo()
        ? null
        : (require('react-native-google-mobile-ads') as AdsModule);
    } catch {
      cached = null;
    }
  }
  return cached;
}
