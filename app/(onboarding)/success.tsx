import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import InfoCard from '@/components/onboarding/InfoCard';
import GradientButton from '@/components/ui/GradientButton';
import { useSettingsStore } from '@/store/settingsStore';
import { useCycleStore } from '@/store/cycleStore';
import { formatDisplayDate } from '@/utils/dateHelpers';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';

const TITLE = '#1E1B4B';
type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function SuccessScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const recompute = useCycleStore((s) => s.recompute);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const name = settings.name || 'there';

  const handleGoToDashboard = () => {
    updateSettings({ onboardingComplete: true });
    recompute(settings.lastPeriodDate, settings.cycleLength, settings.periodLength);
    router.replace('/(tabs)/');
  };

  const summaryRows: { icon: IconName; color: string; bg: string; label: string; value: string }[] = [
    { icon: 'calendar', color: '#EC4899', bg: '#FCE4F1', label: 'Last period start date', value: settings.lastPeriodDate ? formatDisplayDate(settings.lastPeriodDate) : 'Not set' },
    { icon: 'sync', color: COLORS.primary, bg: '#EFE6FB', label: 'Average cycle length', value: `${settings.cycleLength} days` },
    { icon: 'water', color: '#EC4899', bg: '#FCE4F1', label: 'Period length', value: `${settings.periodLength} days` },
    { icon: 'notifications', color: COLORS.primary, bg: '#EFE6FB', label: 'Reminders', value: settings.periodReminders ? 'Enabled' : 'Disabled' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24 }}>

          {/* Success check with confetti */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{ width: 130, height: 130, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: '#F8E1EF', opacity: 0.7 }} />
              <Text style={{ position: 'absolute', top: 6, left: 24, fontSize: 14, color: '#F472B6' }}>✦</Text>
              <Text style={{ position: 'absolute', top: 20, right: 18, fontSize: 12, color: '#C4B5FD' }}>✦</Text>
              <Text style={{ position: 'absolute', bottom: 18, left: 12, fontSize: 12, color: '#C4B5FD' }}>✦</Text>
              <Text style={{ position: 'absolute', bottom: 8, right: 26, fontSize: 14, color: '#F472B6' }}>✦</Text>
              <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#EC4899', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW, shadowColor: '#EC4899' }}>
                <Ionicons name="checkmark" size={44} color="#FFFFFF" />
              </View>
            </View>
          </View>

          <Text style={{ fontFamily: FONT.bold, fontSize: 28, color: TITLE, textAlign: 'center', marginBottom: 10 }}>
            You're all set! 🎉
          </Text>
          <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 }}>
            Your period tracking journey starts now.{'\n'}We're here to support you every step of the way.
          </Text>

          {/* Greeting card */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBE9F3', borderRadius: 24, paddingLeft: 22, paddingVertical: 18, overflow: 'hidden', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONT.medium, fontSize: 18, color: COLORS.textSecondary }}>{greeting},</Text>
              <Text style={{ fontFamily: FONT.bold, fontSize: 26, color: '#EC4899' }}>{name} 🌸</Text>
            </View>
            <Image
              source={require('@/assets/illustrations/character-2.png')}
              style={{ width: 120, height: 120, resizeMode: 'contain' }}
            />
          </View>

          {/* Cycle Summary */}
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 20, ...CARD_SHADOW }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: TITLE }}>Your Cycle Summary</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}
              >
                <Ionicons name="pencil" size={13} color={COLORS.primary} />
                <Text style={{ fontFamily: FONT.semiBold, fontSize: 13, color: COLORS.primary }}>Edit</Text>
              </TouchableOpacity>
            </View>

            {summaryRows.map((row, i) => (
              <View key={row.label}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: row.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={row.icon} size={18} color={row.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: FONT.medium, fontSize: 14, color: TITLE }}>{row.label}</Text>
                  <Text style={{ fontFamily: FONT.bold, fontSize: 14, color: TITLE }}>{row.value}</Text>
                </View>
                {i < summaryRows.length - 1 && <View style={{ height: 1, backgroundColor: '#F1ECF9' }} />}
              </View>
            ))}
          </View>

          <InfoCard
            icon="shield-checkmark"
            iconColor={COLORS.primary}
            title="Your data is safe with us"
            desc="Your privacy is our priority. You can change settings anytime."
          />

          <GradientButton label="Go to My Dashboard" onPress={handleGoToDashboard} hint style={{ width: '100%', marginTop: 'auto', marginBottom: 4, paddingTop: 24 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
