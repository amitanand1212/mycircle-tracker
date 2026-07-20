import { memo, useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { addDays, format, parseISO } from 'date-fns';
import Svg, { Circle } from 'react-native-svg';
import BottomSheet from '@/components/ui/BottomSheet';
import LogEntryForm from '@/components/history/LogEntryForm';
import { useSettingsStore } from '@/store/settingsStore';
import { useCycleStore } from '@/store/cycleStore';
import { useLogStore } from '@/store/logStore';
import { formatShortDate, formatDisplayDate, todayISO } from '@/utils/dateHelpers';
import { recordDailyOpen, shouldAskForReview, setReviewStatus, snoozeReview, openPlayStore } from '@/utils/appReview';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';

const TITLE = '#1E1B4B';

const CycleRing = memo(function CycleRing({ current, total }: { current: number; total: number }) {
  const size = 128;
  const sw = 10;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(current / total, 1) : 0;
  const dash = pct * circ;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={sw}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={COLORS.periodRed}
          strokeWidth={sw}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={{ alignItems: 'center' }}>
        <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
        <Text style={{ fontFamily: FONT.bold, fontSize: 22, color: COLORS.textPrimary, lineHeight: 26, marginTop: 2 }}>
          {current} / {total}
        </Text>
        <Text style={{ fontFamily: FONT.regular, fontSize: 11, color: COLORS.textSecondary }}>Days</Text>
      </View>
    </View>
  );
});

const PHASE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  period:    { label: 'Period',    color: '#EF4444', bg: '#FFE4E8', icon: '🩸' },
  fertile:   { label: 'Fertile',   color: '#16A34A', bg: '#DCFCE7', icon: '🌿' },
  ovulation: { label: 'Ovulation', color: COLORS.primary, bg: '#F3E8FF', icon: '✨' },
  normal:    { label: 'Normal',    color: COLORS.textSecondary, bg: '#F9FAFB', icon: '💜' },
};

export default function DashboardScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const cycleData = useCycleStore((s) => s.cycleData);
  const entries = useLogStore((s) => s.entries);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayISO());

  // Count daily usage and, after a few days, invite the user to rate the app.
  useEffect(() => {
    const streak = recordDailyOpen();
    if (!shouldAskForReview(streak)) return;
    const t = setTimeout(() => {
      Alert.alert(
        'Enjoying My Circle? 💜',
        "You've been tracking with us for a few days! A quick rating on the Play Store really helps us grow. 🌸",
        [
          { text: 'No thanks', style: 'cancel', onPress: () => setReviewStatus('dismissed') },
          { text: 'Maybe later', onPress: () => snoozeReview() },
          { text: 'Rate Now ⭐', onPress: () => { setReviewStatus('rated'); openPlayStore(); } },
        ],
      );
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  const showPremiumSoon = () =>
    Alert.alert(
      'Premium ✨ Coming Soon',
      "Premium isn't available just yet! We're carefully crafting advanced insights, trend analysis, cloud backup and personalized health tips just for you. 💜\n\nYou'll be the first to know when it launches. 🌸",
    );

  const name = settings.name || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const phase = PHASE_CONFIG[cycleData?.currentPhase ?? 'normal'];

  const overviewCards = useMemo(() => [
    {
      label: 'Period',
      icon: '🩸',
      color: '#EF4444',
      value: cycleData
        ? (() => {
            // Current cycle's period = next predicted period minus one cycle.
            const start = addDays(parseISO(cycleData.nextPeriodDate), -settings.cycleLength);
            return `${formatShortDate(format(start, 'yyyy-MM-dd'))} – ${formatShortDate(format(addDays(start, settings.periodLength - 1), 'yyyy-MM-dd'))}`;
          })()
        : '--',
    },
    {
      label: 'Fertile Window',
      icon: '🌸',
      color: '#16A34A',
      value: cycleData
        ? `${formatShortDate(cycleData.fertileWindowStart)} – ${formatShortDate(cycleData.fertileWindowEnd)}`
        : '--',
    },
    {
      label: 'Ovulation',
      icon: '⭕',
      color: COLORS.primary,
      value: cycleData ? formatShortDate(cycleData.ovulationDate) : '--',
    },
    {
      label: 'Next Period',
      icon: '📅',
      color: COLORS.secondary,
      value: cycleData ? formatShortDate(cycleData.nextPeriodDate) : '--',
    },
  ], [settings.lastPeriodDate, settings.cycleLength, settings.periodLength, cycleData]);

  const insightStats = useMemo(() => [
    { icon: 'sync-circle-outline', iconColor: COLORS.primary, value: `${settings.cycleLength}`, unit: 'Days', label: 'Average Cycle Length' },
    { icon: 'water-outline', iconColor: COLORS.secondary, value: `${settings.periodLength}`, unit: 'Days', label: 'Average Period Length' },
    { icon: 'trending-up-outline', iconColor: COLORS.secondary, value: `${Math.max(1, Math.floor(entries.length / settings.periodLength))}`, unit: 'Cycles', label: 'Tracked' },
  ], [settings.cycleLength, settings.periodLength, entries.length]);

  const quickActions = [
    { icon: 'notifications-outline' as const, label: 'Reminders', iconColor: COLORS.primary, iconBg: '#EDE9FE', onPress: () => router.push('/(tabs)/settings') },
    { icon: 'document-text-outline' as const, label: 'Notes', iconColor: '#EC4899', iconBg: '#FCE7F3', onPress: () => router.push('/(tabs)/log') },
    { icon: 'shield-checkmark-outline' as const, label: 'Privacy', iconColor: COLORS.primary, iconBg: '#EDE9FE', onPress: () => router.push('/(tabs)/settings') },
    { icon: 'bar-chart-outline' as const, label: 'Reports', iconColor: '#10B981', iconBg: '#D1FAE5', onPress: () => router.push('/(tabs)/insights') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8FC' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 }}>
          <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}>
            <Image source={require('@/assets/illustrations/logo-mark.png')} style={{ width: 30, height: 30, resizeMode: 'contain' }} />
          </View>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 22, color: COLORS.textPrimary, letterSpacing: -0.5 }}>My Circle</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 11, color: COLORS.textSecondary, marginTop: 1 }}>Track your cycle, privately.</Text>
          </View>

          <TouchableOpacity onPress={showPremiumSoon} activeOpacity={0.85}>
            <LinearGradient
              colors={['#F59E0B', '#EC4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text style={{ fontSize: 12 }}>👑</Text>
              <Text style={{ fontFamily: FONT.semiBold, fontSize: 12, color: '#FFFFFF' }}>Premium</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Greeting ── */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 24, color: COLORS.textPrimary }}>
            {greeting}, {name} 🌸
          </Text>
        </View>

        {/* ── Main Cycle Card ── */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', ...CARD_SHADOW }}>
            {/* Top section with gradient bg */}
            <LinearGradient
              colors={['#F9F3FF', '#FFF0F8']}
              style={{ padding: 20, paddingBottom: 0 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                {/* Left: day info */}
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: COLORS.primary, marginBottom: 2 }}>Cycle Day</Text>
                  <Text style={{ fontFamily: FONT.bold, fontSize: 58, color: COLORS.textPrimary, lineHeight: 62 }}>
                    Day {cycleData?.currentDay ?? '--'}
                  </Text>
                  {/* Phase badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: phase.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 13 }}>{phase.icon}</Text>
                    <Text style={{ fontFamily: FONT.semiBold, fontSize: 13, color: phase.color }}>{phase.label}</Text>
                  </View>
                  <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, marginTop: 8 }}>
                    Period ends in {settings.periodLength} days
                  </Text>
                </View>

                {/* Right: progress ring */}
                <CycleRing
                  current={cycleData?.currentDay ?? 1}
                  total={settings.cycleLength}
                />
              </View>

              {/* Log Symptoms button */}
              <TouchableOpacity onPress={() => { setSelectedDate(todayISO()); setSheetVisible(true); }} style={{ marginTop: 24, marginBottom: -28, alignSelf: 'center', zIndex: 2 }}>
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 22, paddingVertical: 10, paddingHorizontal: 22, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7 }}
                >
                  <Text style={{ fontFamily: FONT.semiBold, fontSize: 13, color: '#FFFFFF' }}>Log Symptoms</Text>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="add" size={15} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* Character illustration decoration */}
              <View style={{ height: 150, marginTop: 14, justifyContent: 'flex-end', overflow: 'hidden' }}>
                <View style={{ position: 'absolute', bottom: -30, left: -24, right: -24, height: 96, backgroundColor: '#FFE4EC', borderRadius: 90 }} />
                <Image
                  source={require('@/assets/illustrations/character-1.png')}
                  style={{ position: 'absolute', bottom: 0, right: 4, width: 150, height: 150 }}
                  resizeMode="contain"
                />
                <Text style={{ position: 'absolute', bottom: 12, left: 18, fontSize: 20, opacity: 0.55 }}>🌿</Text>
                <Text style={{ position: 'absolute', bottom: 30, left: 50, fontSize: 13, opacity: 0.5 }}>🌸</Text>
              </View>
            </LinearGradient>

            {/* Next Period row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFE4EC', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="calendar" size={18} color={COLORS.secondary} />
                </View>
                <View>
                  <Text style={{ fontFamily: FONT.regular, fontSize: 11, color: COLORS.textSecondary }}>Next Period</Text>
                  <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: COLORS.textPrimary }}>
                    {cycleData ? formatDisplayDate(cycleData.nextPeriodDate) : '--'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9F3FF', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}
                onPress={() => router.push('/(onboarding)/last-period')}
              >
                <Ionicons name="pencil-outline" size={12} color={COLORS.primary} />
                <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: COLORS.primary }}>Edit Period</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Cycle Overview ── */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: COLORS.textPrimary }}>Cycle Overview</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/calendar')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: COLORS.primary }}>See Calendar</Text>
              <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {overviewCards.map((card) => (
              <View key={card.label} style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 14, alignItems: 'center', ...CARD_SHADOW }}>
                <Text style={{ fontSize: 22, marginBottom: 6 }}>{card.icon}</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: 9, color: COLORS.textSecondary, marginBottom: 4, textAlign: 'center' }}>{card.label}</Text>
                <Text style={{ fontFamily: FONT.semiBold, fontSize: 10, color: card.color, textAlign: 'center' }}>{card.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── My Cycle Insights ── */}
        <View style={{ paddingHorizontal: 24, marginBottom: 20 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: COLORS.textPrimary, marginBottom: 14 }}>My Cycle Insights</Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, flexDirection: 'row', ...CARD_SHADOW }}>
            {insightStats.map((stat, i) => (
              <View key={stat.label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: '#F3E8FF' }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9F3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <Ionicons name={stat.icon as any} size={20} color={stat.iconColor} />
                </View>
                <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: COLORS.textPrimary }}>
                  {stat.value} <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: COLORS.textSecondary }}>{stat.unit}</Text>
                </Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2, paddingHorizontal: 4 }}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={{ paddingHorizontal: 24 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: COLORS.textPrimary, marginBottom: 14 }}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={action.onPress}
                style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 16, alignItems: 'center', gap: 8, ...CARD_SHADOW }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: action.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={action.icon} size={22} color={action.iconColor} />
                </View>
                <Text style={{ fontFamily: FONT.medium, fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <BottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} snapHeight={640}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE, marginBottom: 12 }}>
            {selectedDate ? format(parseISO(selectedDate), 'EEEE, d MMM yyyy') : ''}
          </Text>
          <LogEntryForm
            key={selectedDate}
            date={selectedDate}
            onSave={() => setSheetVisible(false)}
            onClose={() => setSheetVisible(false)}
          />
        </ScrollView>
      </BottomSheet>
    </SafeAreaView>
  );
}
