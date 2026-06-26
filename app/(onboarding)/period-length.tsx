import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OnboardingIcon from '@/components/onboarding/OnboardingIcon';
import InfoCard from '@/components/onboarding/InfoCard';
import SliderInput from '@/components/onboarding/SliderInput';
import GradientButton from '@/components/ui/GradientButton';
import { useSettingsStore } from '@/store/settingsStore';
import { COLORS, FONT } from '@/constants/theme';

const TITLE = '#1E1B4B';

export default function PeriodLengthScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [value, setValue] = useState(settings.periodLength);

  const handleContinue = () => {
    updateSettings({ periodLength: value });
    router.push('/(onboarding)/notifications');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
      <OnboardingHeader currentStep={4} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>

          <OnboardingIcon icon="water" iconColor="#EC4899" bg="#FCE4F1" heart />

          <Text style={{ fontFamily: FONT.bold, fontSize: 28, color: TITLE, textAlign: 'center', lineHeight: 36 }}>
            How many days does{'\n'}your period usually last?
          </Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 48, paddingHorizontal: 8, lineHeight: 22 }}>
            Select the number of days your period typically lasts.
          </Text>

          <SliderInput value={value} minimumValue={2} maximumValue={10} onValueChange={setValue} />

          <View style={{ marginTop: 'auto', paddingTop: 36 }}>
            <InfoCard icon="heart" iconColor="#EC4899" desc="Most people have a period for 2 to 10 days." />
            <GradientButton label="Continue" onPress={handleContinue} hint style={{ width: '100%', marginTop: 20 }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
