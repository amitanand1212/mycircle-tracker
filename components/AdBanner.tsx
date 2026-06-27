import { useState } from 'react';
import { View } from 'react-native';
import Constants from 'expo-constants';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// "main banner" ad unit from AdMob (Android). Development builds fall back
// to Google's official test unit so we never serve/click a live ad while
// developing — clicking your own real ads can get the AdMob account banned.
// Production / preview (release) builds serve the real ad.
const AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : 'ca-app-pub-7760368408975742/8261551828';

// The native ads module isn't present in Expo Go, so rendering a BannerAd
// there would crash the screen. Render nothing in Expo Go and let the
// JS-only dev workflow keep working (mirrors utils/storage.ts).
const isExpoGo = Constants.appOwnership === 'expo';

export default function AdBanner() {
  const [failed, setFailed] = useState(false);

  // Hide the slot entirely if there's no ad to show, so we never leave an
  // empty bar behind.
  if (isExpoGo || failed) return null;

  return (
    <View
      style={{
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F3E8FF',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}
