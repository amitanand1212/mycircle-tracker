import { Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { format } from 'date-fns';
import { Storage, STORAGE_KEYS } from '@/utils/storage';

/** Android package id — keep in sync with app.json → android.package. */
export const ANDROID_PACKAGE = 'com.lushapp.mycircle';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

/**
 * Distinct days of use before we ask for a rating.
 *
 * These are *total* days, not consecutive ones. The old streak reset to 1 after
 * a single missed day, which almost nobody clears in a cycle tracker — people
 * check in around their period, not every morning — so the prompt rarely fired.
 */
const REQUIRED_DAYS_USED = 3;

interface UsageData {
  lastOpenDate: string; // yyyy-MM-dd
  daysUsed?: number;    // distinct days the app has been opened
  /** Legacy consecutive-day counter; read once so existing users keep credit. */
  streak?: number;
}

export type ReviewStatus = 'pending' | 'rated' | 'dismissed';

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

/** Record that the app was opened today; returns the number of distinct days used. */
export function recordDailyOpen(): number {
  const data = Storage.getObject<UsageData>(STORAGE_KEYS.APP_USAGE);
  const today = todayStr();
  const prior = data?.daysUsed ?? data?.streak ?? 0;

  if (data?.lastOpenDate === today) return prior; // already counted today

  const daysUsed = prior + 1;
  Storage.setObject<UsageData>(STORAGE_KEYS.APP_USAGE, { lastOpenDate: today, daysUsed });
  return daysUsed;
}

export function getReviewStatus(): ReviewStatus {
  return (Storage.getString(STORAGE_KEYS.REVIEW_STATUS) as ReviewStatus) ?? 'pending';
}

export function setReviewStatus(status: ReviewStatus): void {
  Storage.setString(STORAGE_KEYS.REVIEW_STATUS, status);
}

/** True once the user has used the app enough days and hasn't been asked yet. */
export function shouldAskForReview(daysUsed: number): boolean {
  return daysUsed >= REQUIRED_DAYS_USED && getReviewStatus() === 'pending';
}

/**
 * Ask for a rating using Play's in-app review sheet, which keeps the user
 * inside the app instead of bouncing them to the store listing.
 *
 * The API deliberately reports nothing back — it silently shows no sheet when
 * the user has already rated or the per-app quota is spent — so the caller can
 * only record that we asked. Falls back to the store listing where the sheet
 * isn't available (Expo Go, sideloaded builds, no Play Services).
 */
export async function requestInAppReview(): Promise<void> {
  try {
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // Fall through to the listing rather than leaving the user with nothing.
  }
  await openPlayStore();
}

/** Open the Play Store listing (native store app first, web as fallback). */
export async function openPlayStore(): Promise<void> {
  const market = `market://details?id=${ANDROID_PACKAGE}`;
  try {
    const canMarket = await Linking.canOpenURL(market);
    await Linking.openURL(canMarket ? market : PLAY_STORE_URL);
  } catch {
    Linking.openURL(PLAY_STORE_URL).catch(() => {});
  }
}
