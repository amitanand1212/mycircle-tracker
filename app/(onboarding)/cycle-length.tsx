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

export default function CycleLengthScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [value, setValue] = useState(settings.cycleLength);

  const handleContinue = () => {
    updateSettings({ cycleLength: value });
    router.push('/(onboarding)/period-length');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
      <OnboardingHeader currentStep={3} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>

          <OnboardingIcon icon="sync" iconColor={COLORS.primary} bg="#EFE6FB" />

          <Text style={{ fontFamily: FONT.bold, fontSize: 28, color: TITLE, textAlign: 'center', lineHeight: 36 }}>
            What is your average{'\n'}cycle length?
          </Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 48, paddingHorizontal: 8, lineHeight: 22 }}>
            Average time between the first day of one period to the first day of the next period.
          </Text>

          <SliderInput value={value} minimumValue={21} maximumValue={45} onValueChange={setValue} />

          <View style={{ marginTop: 'auto', paddingTop: 36 }}>
            <InfoCard icon="bulb" iconColor="#FBBF24" desc="Most cycles range between 21 to 45 days." />
            <GradientButton label="Continue" onPress={handleContinue} hint style={{ width: '100%', marginTop: 20 }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
