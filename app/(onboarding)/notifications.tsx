import { useState } from 'react';
import { View, Text, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import OnboardingHeader from '@/components/onboarding/OnboardingHeader';
import OnboardingIcon from '@/components/onboarding/OnboardingIcon';
import InfoCard from '@/components/onboarding/InfoCard';
import GradientButton from '@/components/ui/GradientButton';
import OutlineButton from '@/components/ui/OutlineButton';
import { useSettingsStore } from '@/store/settingsStore';
import { useCycleStore } from '@/store/cycleStore';
import { requestNotificationPermission, syncReminders } from '@/utils/notifications';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';

const TITLE = '#1E1B4B';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function ToggleRow({
  icon, iconColor, iconBg, title, subtitle, value, onChange,
}: {
  icon: IconName; iconColor: string; iconBg: string;
  title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 14, marginBottom: 14, ...CARD_SHADOW }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={26} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE, marginBottom: 2 }}>{title}</Text>
        <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E5E0EF', true: COLORS.primary }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#E5E0EF"
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const cycleData = useCycleStore((s) => s.cycleData);
  const [periodReminders, setPeriodReminders] = useState(true);
  const [ovulationReminders, setOvulationReminders] = useState(true);

  const handleAllow = async () => {
    updateSettings({ periodReminders, ovulationReminders });
    const granted = await requestNotificationPermission();
    // Move on immediately; schedule reminders in the background so navigation feels instant.
    router.push('/(onboarding)/app-lock');
    if (granted) {
      syncReminders({
        periodReminders,
        ovulationReminders,
        waterReminders: settings.waterReminders,
        logReminders: settings.logReminders,
        nextPeriodDate: cycleData?.nextPeriodDate,
        ovulationDate: cycleData?.ovulationDate,
        fertileStartDate: cycleData?.fertileWindowStart,
      }).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
      <OnboardingHeader currentStep={5} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>

          <OnboardingIcon icon="notifications" iconColor="#EC4899" bg="#FCE4F1" heart />

          <Text style={{ fontFamily: FONT.bold, fontSize: 28, color: TITLE, textAlign: 'center', lineHeight: 36 }}>
            Would you like to{'\n'}enable reminders?
          </Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, marginBottom: 32, paddingHorizontal: 8, lineHeight: 22 }}>
            We'll remind you about your period, ovulation and more.
          </Text>

          <ToggleRow
            icon="water" iconColor="#EC4899" iconBg="#FCE4F1"
            title="Period reminders"
            subtitle="Get reminded before your period starts."
            value={periodReminders} onChange={setPeriodReminders}
          />
          <ToggleRow
            icon="flower" iconColor="#EC4899" iconBg="#FCE4F1"
            title="Ovulation reminders"
            subtitle="Get notified about your fertile window."
            value={ovulationReminders} onChange={setOvulationReminders}
          />

          <View style={{ marginTop: 'auto', paddingTop: 24 }}>
            <InfoCard
              icon="notifications-outline"
              iconColor={COLORS.primary}
              title="You're in control"
              desc="You can change or turn off these reminders anytime from settings."
            />
            <GradientButton label="Allow Notifications" onPress={handleAllow} hint style={{ width: '100%', marginTop: 20 }} />
            <OutlineButton label="Skip for now" onPress={() => router.push('/(onboarding)/app-lock')} style={{ marginTop: 12 }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
