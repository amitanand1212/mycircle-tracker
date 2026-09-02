import { getAdsModule } from '@/utils/ads';

/** "my circle main" interstitial unit from AdMob (Android). */
const LIVE_AD_UNIT_ID = 'ca-app-pub-7760368408975742/1615498796';

/** Minimum time between two interstitials. */
const MIN_GAP_MS = 3 * 60 * 1000;
/** Hard ceiling per app session. */
const MAX_PER_SESSION = 3;
/**
 * Quiet period after launch. A full-screen ad on someone's very first tap is
 * the worst possible first impression, and roughly a third of installs never
 * open the app twice as it is — so the first minute is left alone.
 */
const STARTUP_GRACE_MS = 45 * 1000;
/**
 * Bottom sheets close over 240ms. Launching the ad activity mid-animation is
 * how the log sheet broke before, so triggers that fire on close wait it out.
 */
const SHEET_CLOSE_DELAY_MS = 600;

type Interstitial = { loaded: boolean; load(): void; show(): Promise<void> };

let ad: Interstitial | null = null;
let isLoaded = false;
let shownThisSession = 0;
let lastShownAt = 0;
const startedAt = Date.now();

/**
 * Create and load the interstitial. Safe to call more than once; a no-op in
 * Expo Go, where {@link getAdsModule} has no native module to hand back.
 */
export function preloadInterstitial(): void {
  if (ad) return;

  const ads = getAdsModule();
  if (!ads) return;

  const { InterstitialAd, AdEventType, TestIds } = ads;
  // Release builds serve the real unit; anything else uses Google's sample so
  // we never click a live ad while developing — that gets accounts banned.
  const unitId = __DEV__ ? (TestIds.INTERSTITIAL_VIDEO ?? TestIds.INTERSTITIAL) : LIVE_AD_UNIT_ID;

  try {
    const instance = InterstitialAd.createForAdRequest(unitId) as unknown as Interstitial & {
      addAdEventListener(type: string, cb: () => void): () => void;
    };

    instance.addAdEventListener(AdEventType.LOADED, () => {
      isLoaded = true;
    });
    instance.addAdEventListener(AdEventType.ERROR, () => {
      isLoaded = false;
    });
    instance.addAdEventListener(AdEventType.CLOSED, () => {
      // A loaded ad is consumed once shown, so fetch the next one immediately.
      isLoaded = false;
      try {
        instance.load();
      } catch {}
    });

    ad = instance;
    instance.load();
  } catch {
    ad = null;
  }
}

/** Whether an ad may be shown right now, per the frequency rules above. */
function canShow(): boolean {
  if (!ad || !isLoaded) return false;
  if (shownThisSession >= MAX_PER_SESSION) return false;
  if (Date.now() - startedAt < STARTUP_GRACE_MS) return false;
  return lastShownAt === 0 || Date.now() - lastShownAt >= MIN_GAP_MS;
}

/**
 * Show an interstitial if the frequency rules allow it, otherwise do nothing.
 *
 * Call this at genuine transition points only — never on app launch or exit,
 * both of which are disallowed interstitial placements under AdMob policy.
 */
export function maybeShowInterstitial(): void {
  if (!canShow() || !ad) return;

  shownThisSession += 1;
  lastShownAt = Date.now();
  ad.show().catch(() => {});
}

/**
 * Same as {@link maybeShowInterstitial}, but waits for a closing bottom sheet
 * to finish animating first. Returns a cancel function for cleanup.
 */
export function maybeShowInterstitialAfterSheet(): () => void {
  const timer = setTimeout(maybeShowInterstitial, SHEET_CLOSE_DELAY_MS);
  return () => clearTimeout(timer);
}
