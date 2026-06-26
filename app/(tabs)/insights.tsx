import { memo, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import { format, startOfMonth, isSameMonth, parseISO, differenceInDays } from 'date-fns';
import { useSettingsStore } from '@/store/settingsStore';
import { useLogStore } from '@/store/logStore';
import { useCycleStore } from '@/store/cycleStore';
import { useSymptomsStore, resolveSymptomMeta } from '@/store/symptomsStore';
import { computeInsights } from '@/utils/cycleCalculator';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';
import type { MoodType, SymptomType } from '@/types';

const TITLE = '#1E1B4B';

const TABS = [
  { key: 'Overview', icon: 'stats-chart' },
  { key: 'Periods', icon: 'water' },
  { key: 'Cycle', icon: 'sync' },
  { key: 'Symptoms', icon: 'flash' },
  { key: 'Mood', icon: 'happy' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

const MOOD_META: Record<MoodType, { label: string; color: string }> = {
  happy:     { label: 'Happy',     color: '#34D399' },
  calm:      { label: 'Calm',      color: '#60A5FA' },
  normal:    { label: 'Normal',    color: '#FBBF24' },
  sad:       { label: 'Sad',       color: '#A78BFA' },
  irritable: { label: 'Irritable', color: '#F472B6' },
};

const InfoButton = memo(function InfoButton({ title, message }: { title: string; message: string }) {
  return (
    <TouchableOpacity
      onPress={() => Alert.alert(title, message)}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      activeOpacity={0.6}
    >
      <Ionicons name="information-circle-outline" size={15} color={COLORS.textSecondary} />
    </TouchableOpacity>
  );
});

export default function InsightsScreen() {
  const settings = useSettingsStore((s) => s.settings);
  const entries = useLogStore((s) => s.entries);
  const cycleData = useCycleStore((s) => s.cycleData);
  const [tab] = useState<TabKey>('Overview');

  const showPremiumSoon = () =>
    Alert.alert(
      'Premium ✨ Coming Soon',
      "Premium isn't available just yet! We're carefully crafting advanced insights, trend analysis, cloud backup and personalized health tips just for you. 💜\n\nYou'll be the first to know when it launches. 🌸",
    );

  const symptomDefs = useSymptomsStore((s) => s.symptoms);
  const insights = useMemo(() => computeInsights(entries, settings), [entries, settings]);
  const show = (allowed: TabKey[]) => tab === 'Overview' || allowed.includes(tab);

  // ── Summary (real, this month) ──
  const waterMl = useMemo(
    () => entries.filter((e) => isSameMonth(parseISO(e.date), new Date())).reduce((s, e) => s + (e.waterIntake || 0), 0),
    [entries],
  );
  const monthRange = `${format(startOfMonth(new Date()), 'd')} – ${format(new Date(), 'd MMM yyyy')}`;

  // Fertile window length from your cycle settings (1 ovulation day per cycle)
  const fertileDays = cycleData
    ? differenceInDays(parseISO(cycleData.fertileWindowEnd), parseISO(cycleData.fertileWindowStart)) + 1
    : 0;

  // ── Symptoms ──
  const topSymptoms = useMemo(() => {
    const denom = Math.max(entries.length, 1);
    return (Object.entries(insights.symptomFrequency) as [SymptomType, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ key, pct: Math.round((count / denom) * 100), ...resolveSymptomMeta(symptomDefs, key) }));
  }, [insights, entries, symptomDefs]);

  // ── Mood ──
  const totalMoods = (Object.values(insights.moodDistribution).reduce((a, b) => (a ?? 0) + (b ?? 0), 0) as number) || 0;
  const moodList = (Object.entries(insights.moodDistribution) as [MoodType, number][])
    .map(([key, count]) => ({ key, pct: Math.round((count / (totalMoods || 1)) * 100), ...MOOD_META[key] }))
    .sort((a, b) => b.pct - a.pct);
  const pieData = moodList.map((m) => ({ value: m.pct, color: m.color }));

  const ovulationDay = settings.cycleLength - 14;
  const isRegular = settings.cycleLength >= 21 && settings.cycleLength <= 35;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF1F6' }}>
      {/* Header */}
      <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 23, color: TITLE }}>Insights ✨</Text>
        <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>Understand your body better</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 }}>

        {/* Cycle Summary */}
        {show(['Periods', 'Cycle']) && (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 16, ...CARD_SHADOW }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: TITLE }}>Your Cycle Summary</Text>
                <InfoButton title="Your Cycle Summary" message="A snapshot of this month: your period length, fertile days, ovulation day, and total water intake. Averages are based on your tracked data." />
              </View>
              <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>{monthRange}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[
                { icon: 'water', color: '#EC4899', bg: '#FCE4F1', value: `${settings.periodLength}`, label: 'Period Days' },
                { icon: 'leaf', color: '#16A34A', bg: '#E3F5E6', value: `${fertileDays}`, label: 'Fertile Days' },
                { icon: 'ellipse', color: '#7C5CFC', bg: '#EFE6FB', value: '1', label: 'Ovulation Day' },
                { icon: 'water', color: '#3B82F6', bg: '#E6F0FB', value: `${(waterMl / 1000).toFixed(1)} L`, label: 'Water Intake' },
              ].map((s) => (
                <View key={s.label} style={{ flex: 1, backgroundColor: s.bg, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}>
                  <Ionicons name={s.icon as any} size={22} color={s.color} />
                  <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: TITLE, marginTop: 6 }}>{s.value}</Text>
                  <Text style={{ fontFamily: FONT.medium, fontSize: 9, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Cycle Length */}
        {show(['Cycle']) && (
          <StatCard
            title="Cycle Length"
            value={`${settings.cycleLength}`}
            unit="days"
            valueColor={COLORS.primary}
            subtitle="Average Cycle Length"
            entriesLogged={entries.length}
          />
        )}

        {/* Period Length */}
        {show(['Periods']) && (
          <StatCard
            title="Period Length"
            value={`${settings.periodLength}`}
            unit="days"
            valueColor="#EC4899"
            subtitle="Average Period Length"
            entriesLogged={entries.length}
          />
        )}

        {/* Symptoms + Mood */}
        {show(['Symptoms']) && (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 16, ...CARD_SHADOW }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE }}>Most Common Symptoms</Text>
              <InfoButton title="Most Common Symptoms" message="The symptoms you log most often, shown as a percentage of your total logged entries. Log more days to make this more accurate." />
            </View>
            {topSymptoms.length === 0 ? (
              <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, paddingVertical: 12 }}>
                Log symptoms to see your most common patterns here.
              </Text>
            ) : (
              topSymptoms.map((s) => (
                <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: `${s.color}22`, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={s.icon as any} size={16} color={s.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.semiBold, fontSize: 13, color: TITLE, marginBottom: 4 }}>{s.label}</Text>
                    <View style={{ height: 7, borderRadius: 4, backgroundColor: '#F1ECF7', overflow: 'hidden' }}>
                      <View style={{ width: `${s.pct}%`, height: '100%', borderRadius: 4, backgroundColor: s.color }} />
                    </View>
                  </View>
                  <Text style={{ fontFamily: FONT.bold, fontSize: 13, color: TITLE, width: 40, textAlign: 'right' }}>{s.pct}%</Text>
                </View>
              ))
            )}
          </View>
        )}

        {show(['Mood']) && (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 16, ...CARD_SHADOW }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE }}>Mood Distribution</Text>
              <InfoButton title="Mood Distribution" message="How your logged moods break down across all your entries, shown as percentages." />
            </View>
            {pieData.length === 0 ? (
              <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, paddingVertical: 12 }}>
                Log your mood to see your distribution.
              </Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <PieChart
                  data={pieData}
                  donut
                  radius={64}
                  innerRadius={40}
                  innerCircleColor="#FFFFFF"
                  centerLabelComponent={() => <Text style={{ fontSize: 22 }}>🙂</Text>}
                />
                <View style={{ flex: 1, paddingLeft: 16, gap: 8 }}>
                  {moodList.map((m) => (
                    <View key={m.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: m.color, marginRight: 8 }} />
                      <Text style={{ flex: 1, fontFamily: FONT.medium, fontSize: 13, color: TITLE }}>{m.label}</Text>
                      <Text style={{ fontFamily: FONT.bold, fontSize: 13, color: TITLE }}>{m.pct}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Pattern Analysis */}
        {tab === 'Overview' && (
          <LinearGradient colors={['#F6E9F6', '#FBEAF1']} style={{ borderRadius: 24, padding: 18, marginBottom: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Text style={{ fontSize: 14 }}>✨</Text>
                <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE }}>Pattern Analysis</Text>
              </View>
              <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: TITLE, marginBottom: 6 }}>
                Your cycle is {isRegular ? 'regular' : 'irregular'} ✨
              </Text>
              <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 }}>
                You ovulate on average on day {ovulationDay}.{'\n'}Your luteal phase is about 14 days.
              </Text>
            </View>
            <Image source={require('@/assets/illustrations/character-1.png')} style={{ width: 110, height: 110, resizeMode: 'contain' }} />
          </LinearGradient>
        )}

        {/* Go Premium */}
        <LinearGradient colors={['#EFE6FB', '#F8EAF4']} style={{ borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="diamond" size={24} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE }}>Go Premium 👑</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 }}>
              Unlock advanced insights, trend analysis, and personalized health tips.
            </Text>
          </View>
          <TouchableOpacity onPress={showPremiumSoon} activeOpacity={0.85}>
            <LinearGradient colors={['#8B5CF6', '#A855F7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text style={{ fontFamily: FONT.semiBold, fontSize: 12, color: '#FFFFFF' }}>Upgrade Now</Text>
              <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const StatCard = memo(function StatCard({
  title, value, unit, valueColor, subtitle, entriesLogged,
}: {
  title: string; value: string; unit: string; valueColor: string; subtitle: string; entriesLogged: number;
}) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 18, marginBottom: 16, ...CARD_SHADOW }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE }}>{title}</Text>
        <InfoButton title={title} message={`${subtitle}, based on your profile settings. A month-by-month trend will appear here once you've logged a few full cycles.`} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 130 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 38, color: valueColor }}>{value}</Text>
            <Text style={{ fontFamily: FONT.medium, fontSize: 15, color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4 }}>{unit}</Text>
          </View>
          <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>{subtitle}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
          <Ionicons name="trending-up-outline" size={26} color={COLORS.textSecondary} />
          <Text style={{ fontFamily: FONT.regular, fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 16 }}>
            {entriesLogged > 0
              ? 'Keep logging to unlock your month-by-month trend.'
              : 'Start logging to build your trend over time.'}
          </Text>
        </View>
      </View>
    </View>
  );
});
