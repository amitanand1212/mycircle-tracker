import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OnboardingIcon from '@/components/onboarding/OnboardingIcon';
import InfoCard from '@/components/onboarding/InfoCard';
import GradientButton from '@/components/ui/GradientButton';
import { useSettingsStore } from '@/store/settingsStore';
import { toISODateString } from '@/utils/dateHelpers';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';

const TITLE = '#1E1B4B';

export default function LastPeriodScreen() {
  const router = useRouter();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const today = toISODateString(new Date());
  const [selected, setSelected] = useState(today);

  const handleContinue = () => {
    updateSettings({ lastPeriodDate: selected });
    router.push('/(onboarding)/cycle-length');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
      <OnboardingHeader currentStep={2} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>

          <OnboardingIcon icon="calendar" iconColor="#EC4899" bg="#FCE4F1" heart />

          <Text style={{ fontFamily: FONT.bold, fontSize: 30, color: TITLE, textAlign: 'center', lineHeight: 38 }}>
            When did your{'\n'}last period start?
          </Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
            This helps us predict your cycle accurately.
          </Text>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', padding: 8, ...CARD_SHADOW }}>
            <Calendar
              maxDate={today}
              onDayPress={(day) => setSelected(day.dateString)}
              markedDates={{
                [selected]: { selected: true, selectedColor: '#EC4899', selectedTextColor: '#FFFFFF' },
              }}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: '#9CA3AF',
                dayTextColor: TITLE,
                textDisabledColor: '#D8D2E0',
                todayTextColor: '#EC4899',
                selectedDayTextColor: '#FFFFFF',
                selectedDayBackgroundColor: '#EC4899',
                arrowColor: COLORS.primary,
                monthTextColor: TITLE,
                textDayFontFamily: FONT.medium,
                textMonthFontFamily: FONT.bold,
                textDayHeaderFontFamily: FONT.medium,
                textDayFontSize: 15,
                textMonthFontSize: 17,
                textDayHeaderFontSize: 12,
              }}
            />
          </View>

          <View style={{ marginTop: 'auto', paddingTop: 20 }}>
            <InfoCard
              icon="calendar"
              iconColor="#EC4899"
              title="Don't remember?"
              desc="Pick the date that you think is closest."
            />
            <GradientButton label="Continue" onPress={handleContinue} disabled={!selected} hint style={{ width: '100%', marginTop: 20 }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
