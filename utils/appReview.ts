import { Linking } from 'react-native';
import { format, subDays } from 'date-fns';
import { Storage, STORAGE_KEYS } from '@/utils/storage';

/** Android package id — keep in sync with app.json → android.package. */
export const ANDROID_PACKAGE = 'com.lushapp.mycircle';
export const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;

/** Consecutive days of use before we ask for a rating. */
const REQUIRED_STREAK = 3;

interface UsageData {
  lastOpenDate: string; // yyyy-MM-dd
  streak: number;       // consecutive days used
}

export type ReviewStatus = 'pending' | 'rated' | 'dismissed';

const todayStr = () => format(new Date(), 'yyyy-MM-dd');
const yesterdayStr = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');

/** Record that the app was opened today; returns the current consecutive-day streak. */
export function recordDailyOpen(): number {
  const data = Storage.getObject<UsageData>(STORAGE_KEYS.APP_USAGE);
  const today = todayStr();

  if (data?.lastOpenDate === today) return data.streak; // already counted today

  const streak = data?.lastOpenDate === yesterdayStr() ? data.streak + 1 : 1;
  Storage.setObject<UsageData>(STORAGE_KEYS.APP_USAGE, { lastOpenDate: today, streak });
  return streak;
}

export function getReviewStatus(): ReviewStatus {
  return (Storage.getString(STORAGE_KEYS.REVIEW_STATUS) as ReviewStatus) ?? 'pending';
}

export function setReviewStatus(status: ReviewStatus): void {
  Storage.setString(STORAGE_KEYS.REVIEW_STATUS, status);
}

/** True once the user has used the app enough days and hasn't rated/dismissed yet. */
export function shouldAskForReview(streak: number): boolean {
  return streak >= REQUIRED_STREAK && getReviewStatus() === 'pending';
}

/** "Later" — reset the streak so we re-ask after a few more days of use. */
export function snoozeReview(): void {
  Storage.setObject<UsageData>(STORAGE_KEYS.APP_USAGE, { lastOpenDate: todayStr(), streak: 0 });
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
