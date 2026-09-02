import { useState } from 'react';
import { View, Text } from 'react-native';
import { getAdsModule } from '@/utils/ads';
import { COLORS, FONT } from '@/constants/theme';

// "main banner" ad unit from AdMob (Android). Development builds fall back
// to Google's official test unit so we never serve/click a live ad while
// developing — clicking your own real ads can get the AdMob account banned.
// Production / preview (release) builds serve the real ad.
const LIVE_AD_UNIT_ID = 'ca-app-pub-7760368408975742/5872484173';

/**
 * In-content banner, rendered as another card inside a screen's ScrollView.
 *
 * It is deliberately *not* anchored above the tab bar, which is where this
 * banner used to live (commit 78e4c63). That position had two problems: the
 * native ad view sat as a sibling of the log sheet's Modal and crashed Android
 * when the sheet opened, and AdMob calls a banner sandwiched between content
 * and bottom navigation a discouraged implementation because users cross it
 * on every tab switch and click it by accident.
 */
export default function AdBanner() {
  const [failed, setFailed] = useState(false);

  // Null in Expo Go, where the native ads module isn't present. Hide the slot
  // entirely if there's no ad to show, so we never leave an empty box behind.
  const ads = getAdsModule();
  if (!ads || failed) return null;

  const { BannerAd, BannerAdSize, TestIds } = ads;

  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
      {/* A label plus the card border keeps a visible boundary between the ad
          and the app's own content, which is what AdMob asks for. */}
      <Text
        style={{
          fontFamily: FONT.regular,
          fontSize: 10,
          color: COLORS.textSecondary,
          marginBottom: 6,
          letterSpacing: 0.5,
        }}
      >
        ADVERTISEMENT
      </Text>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#F3E8FF',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BannerAd
          unitId={__DEV__ ? TestIds.ADAPTIVE_BANNER : LIVE_AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          onAdFailedToLoad={() => setFailed(true)}
        />
      </View>
    </View>
  );
}
