import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  addMonths, startOfMonth, startOfWeek, addDays, isSameMonth, isSameDay,
  format, parseISO, differenceInDays, isToday,
} from 'date-fns';
import BottomSheet from '@/components/ui/BottomSheet';
import LogEntryForm from '@/components/history/LogEntryForm';
import { useSettingsStore } from '@/store/settingsStore';
import { useCycleStore } from '@/store/cycleStore';
import { useLogStore } from '@/store/logStore';
import { toISODateString, todayISO } from '@/utils/dateHelpers';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';
import type { CyclePhase } from '@/types';

const { width } = Dimensions.get('window');
const TITLE = '#1E1B4B';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const PHASE_STYLE: Record<Exclude<CyclePhase, 'normal'>, { bg: string; text: string; dot: string }> = {
  period:    { bg: '#FBD3E1', text: '#DB2777', dot: '#EC4899' },
  fertile:   { bg: '#D7F0DB', text: '#16A34A', dot: '#22C55E' },
  ovulation: { bg: '#7C5CFC', text: '#FFFFFF', dot: '#FFFFFF' },
};

const LEGEND = [
  { type: 'dot',   color: '#EC4899', label: 'Period' },
  { type: 'dot',   color: '#86EFAC', label: 'Fertile Window' },
  { type: 'dot',   color: '#7C5CFC', label: 'Ovulation' },
  { type: 'heart', color: '#EC4899', label: 'Intimacy' },
];

const VIEW_MODES = ['Month', 'Week', 'List'] as const;
type ViewMode = (typeof VIEW_MODES)[number];

/** Project the cycle phase onto any date (repeats every cycle). */
function phaseForDate(date: Date, lastPeriodDate: string, cycleLength: number, periodLength: number): CyclePhase {
  if (!lastPeriodDate) return 'normal';
  const diff = differenceInDays(date, parseISO(lastPeriodDate));
  const cycleDay = (((diff % cycleLength) + cycleLength) % cycleLength) + 1;
  if (cycleDay <= periodLength) return 'period';
  const ov = cycleLength - 14;
  if (cycleDay === ov) return 'ovulation';
  if (cycleDay >= ov - 5 && cycleDay < ov) return 'fertile';
  return 'normal';
}

export default function CalendarScreen() {
  const router = useRouter();
  const settings = useSettingsStore((s) => s.settings);
  const cycleData = useCycleStore((s) => s.cycleData);
  const entries = useLogStore((s) => s.entries);

  const [viewMode, setViewMode] = useState<ViewMode>('Month');
  const [displayMonth, setDisplayMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [sheetVisible, setSheetVisible] = useState(false);

  const entryDates = useMemo(() => new Set(entries.map((e) => e.date)), [entries]);

  const monthCells = useMemo(() => {
    const start = startOfWeek(startOfMonth(displayMonth), { weekStartsOn: 1 });
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [displayMonth]);

  const weekCells = useMemo(() => {
    const start = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  // Precompute each visible cell's phase once. Keyed on the cells + cycle settings
  // (NOT selectedDate), so tapping a day doesn't recompute all 42 cells.
  const monthPhase = useMemo(() => {
    const m = new Map<string, CyclePhase>();
    for (const d of monthCells) m.set(toISODateString(d), phaseForDate(d, settings.lastPeriodDate, settings.cycleLength, settings.periodLength));
    return m;
  }, [monthCells, settings.lastPeriodDate, settings.cycleLength, settings.periodLength]);

  const weekPhase = useMemo(() => {
    const m = new Map<string, CyclePhase>();
    for (const d of weekCells) m.set(toISODateString(d), phaseForDate(d, settings.lastPeriodDate, settings.cycleLength, settings.periodLength));
    return m;
  }, [weekCells, settings.lastPeriodDate, settings.cycleLength, settings.periodLength]);

  const phaseByIso = viewMode === 'Week' ? weekPhase : monthPhase;

  const openDay = (d: Date) => {
    setSelectedDate(toISODateString(d));
    setSheetVisible(true);
  };

  const renderCell = (d: Date) => {
    const iso = toISODateString(d);
    const inMonth = isSameMonth(d, displayMonth) || viewMode === 'Week';
    const phase = phaseByIso.get(iso) ?? 'normal';
    const selected = iso === selectedDate;
    const ps = phase !== 'normal' ? PHASE_STYLE[phase] : null;
    const hasEntry = entryDates.has(iso);
    const showIntimacy = phase === 'normal' && hasEntry;

    return (
      <TouchableOpacity
        key={iso}
        activeOpacity={0.7}
        onPress={() => openDay(d)}
        style={{ width: (width - 32) / 7, alignItems: 'center', paddingVertical: 6 }}
      >
        <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
          backgroundColor: ps ? ps.bg : 'transparent',
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? COLORS.primary : 'transparent',
        }}>
          <Text style={{
            fontFamily: ps || isToday(d) ? FONT.bold : FONT.medium,
            fontSize: 15,
            color: ps ? ps.text : inMonth ? TITLE : '#C9C4D1',
          }}>
            {format(d, 'd')}
          </Text>
          {phase === 'ovulation' && (
            <Ionicons name="heart" size={9} color="#FFFFFF" style={{ marginTop: -1 }} />
          )}
        </View>

        {/* marker below */}
        <View style={{ height: 12, alignItems: 'center', justifyContent: 'center' }}>
          {phase === 'period' && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: ps!.dot }} />}
          {phase === 'fertile' && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: ps!.dot }} />}
          {showIntimacy && <Ionicons name="heart" size={11} color="#EC4899" />}
        </View>
      </TouchableOpacity>
    );
  };

  // Phase summary dates for the bottom card
  const phaseDates = cycleData
    ? (() => {
        // Current cycle's period start = next predicted period minus one cycle.
        const periodStart = addDays(parseISO(cycleData.nextPeriodDate), -settings.cycleLength);
        return {
          periodRange: `${format(periodStart, 'd')}–${format(addDays(periodStart, settings.periodLength - 1), 'd MMM')}`,
          fertileRange: `${format(parseISO(cycleData.fertileWindowStart), 'd')}–${format(parseISO(cycleData.fertileWindowEnd), 'd MMM')}`,
          ovulation: format(parseISO(cycleData.ovulationDate), 'd MMM'),
          nextPeriod: format(parseISO(cycleData.nextPeriodDate), 'd MMM'),
        };
      })()
    : null;

  const phaseTitle =
    cycleData?.currentPhase === 'ovulation' ? 'Ovulation Day'
    : cycleData?.currentPhase === 'fertile' ? 'Fertile Window'
    : cycleData?.currentPhase === 'period' ? 'Period Day'
    : 'Regular Day';

  const phaseEmoji =
    cycleData?.currentPhase === 'ovulation' ? '💜'
    : cycleData?.currentPhase === 'fertile' ? '🌿'
    : cycleData?.currentPhase === 'period' ? '🩸'
    : '🌸';

  const phaseDesc =
    cycleData?.currentPhase === 'ovulation' ? 'You are most likely to conceive today!'
    : cycleData?.currentPhase === 'fertile' ? 'Your fertile window — higher chance to conceive.'
    : cycleData?.currentPhase === 'period' ? 'Take care of yourself today. 🌸'
    : 'A regular day in your cycle.';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF1F6' }}>
      {/* Header */}
      <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 24, color: TITLE }}>Calendar</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* View toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: '#F1E7F0', borderRadius: 24, marginHorizontal: 20, padding: 4, marginBottom: 16 }}>
          {VIEW_MODES.map((m) => {
            const active = viewMode === m;
            return (
              <TouchableOpacity key={m} onPress={() => setViewMode(m)} style={{ flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center', backgroundColor: active ? '#FFFFFF' : 'transparent', ...(active ? CARD_SHADOW : {}) }}>
                <Text style={{ fontFamily: active ? FONT.bold : FONT.medium, fontSize: 14, color: active ? COLORS.secondary : COLORS.textSecondary }}>{m}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Month navigation */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 12 }}>
          <TouchableOpacity onPress={() => setDisplayMonth((m) => addMonths(m, -1))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}>
            <Ionicons name="chevron-back" size={20} color={TITLE} />
          </TouchableOpacity>
          <Text style={{ fontFamily: FONT.bold, fontSize: 20, color: TITLE }}>{format(displayMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={() => setDisplayMonth((m) => addMonths(m, 1))} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}>
            <Ionicons name="chevron-forward" size={20} color={TITLE} />
          </TouchableOpacity>
        </View>

        {/* Weekday header */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 4 }}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={{ width: (width - 32) / 7, textAlign: 'center', fontFamily: FONT.medium, fontSize: 12, color: COLORS.textSecondary }}>{w}</Text>
          ))}
        </View>
        <View style={{ height: 1, backgroundColor: '#EFE3EC', marginHorizontal: 16, marginBottom: 4 }} />

        {/* Grid */}
        {viewMode === 'List' ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
            {monthCells.filter((d) => isSameMonth(d, displayMonth)).map((d) => {
              const phase = monthPhase.get(toISODateString(d)) ?? 'normal';
              const hasEntry = entryDates.has(toISODateString(d));
              if (phase === 'normal' && !hasEntry) return null;
              const ps = phase !== 'normal' ? PHASE_STYLE[phase] : null;
              return (
                <TouchableOpacity key={toISODateString(d)} onPress={() => openDay(d)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 10, ...CARD_SHADOW }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: ps ? ps.bg : '#FCE4F1', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: ps ? ps.text : '#EC4899' }}>{format(d, 'd')}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: TITLE }}>{format(d, 'EEEE, d MMM')}</Text>
                    <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>
                      {phase !== 'normal' ? phaseTitleFor(phase) : 'Logged entry'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 }}>
            {(viewMode === 'Week' ? weekCells : monthCells).map(renderCell)}
          </View>
        )}

        {/* Legend */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 18, marginHorizontal: 20, marginTop: 12, marginBottom: 16, paddingVertical: 14, paddingHorizontal: 14, ...CARD_SHADOW }}>
          {LEGEND.map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {item.type === 'heart'
                ? <Ionicons name="heart" size={12} color={item.color} />
                : <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: item.color }} />}
              <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: TITLE }}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Today phase card */}
        <LinearGradient
          colors={['#EFE6FB', '#F8EAF6']}
          style={{ marginHorizontal: 20, borderRadius: 24, padding: 18, marginBottom: 16, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}
        >
          {/* Moon circle */}
          <LinearGradient colors={['#A78BFA', '#F0ABFC']} style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFFFFF' }}>
            <Ionicons name="moon" size={34} color="#FFFFFF" />
            <Text style={{ position: 'absolute', top: 12, right: 18, fontSize: 9, color: '#FFFFFF' }}>✦</Text>
          </LinearGradient>

          <View style={{ flex: 1, paddingLeft: 14 }}>
            <Text style={{ fontFamily: FONT.semiBold, fontSize: 13, color: COLORS.primary, marginBottom: 2 }}>
              Today, {format(new Date(), 'd MMM yyyy')}
            </Text>
            <Text style={{ fontFamily: FONT.bold, fontSize: 20, color: TITLE, marginBottom: 4 }}>{phaseTitle} {phaseEmoji}</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 18 }}>{phaseDesc}</Text>
            <TouchableOpacity
              onPress={() => { setSelectedDate(todayISO()); setSheetVisible(true); }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start' }}
            >
              <Ionicons name="pencil" size={13} color={COLORS.primary} />
              <Text style={{ fontFamily: FONT.medium, fontSize: 13, color: COLORS.primary }}>Log symptoms</Text>
            </TouchableOpacity>
          </View>

          <Ionicons name="heart" size={30} color="#F472B6" style={{ position: 'absolute', right: 22, top: 28 }} />
          <Text style={{ position: 'absolute', right: 16, top: 16, fontSize: 12, color: '#C4B5FD' }}>✦</Text>
        </LinearGradient>

        {/* Cycle Phases */}
        {phaseDates && (
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, marginHorizontal: 20, padding: 20, ...CARD_SHADOW }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: TITLE }}>Cycle Phases</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/insights')} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Text style={{ fontFamily: FONT.semiBold, fontSize: 13, color: COLORS.primary }}>View Insights</Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Phase bar */}
            <View style={{ paddingTop: 8, marginBottom: 14 }}>
              <View style={{ height: 8, flexDirection: 'row', borderRadius: 4, overflow: 'hidden' }}>
                <View style={{ flex: 2, backgroundColor: '#F4A6C5' }} />
                <View style={{ flex: 3, backgroundColor: '#A7E0B0' }} />
                <View style={{ flex: 4, backgroundColor: '#F6CBDD' }} />
              </View>
              <View style={{ position: 'absolute', left: '52%', top: 1, width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C5CFC', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF' }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
              </View>
            </View>

            {/* Phase labels */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {[
                { label: 'Period', value: phaseDates.periodRange, color: TITLE },
                { label: 'Fertile Window', value: phaseDates.fertileRange, color: TITLE },
                { label: 'Ovulation', value: phaseDates.ovulation, color: COLORS.primary },
                { label: 'Next Period', value: phaseDates.nextPeriod, color: TITLE },
              ].map((p) => (
                <View key={p.label} style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontFamily: FONT.medium, fontSize: 10, color: p.color, textAlign: 'center' }}>{p.label}</Text>
                  <Text style={{ fontFamily: FONT.semiBold, fontSize: 11, color: p.color, textAlign: 'center', marginTop: 2 }}>{p.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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

function phaseTitleFor(phase: CyclePhase): string {
  return phase === 'ovulation' ? 'Ovulation Day'
    : phase === 'fertile' ? 'Fertile Window'
    : phase === 'period' ? 'Period Day'
    : 'Regular Day';
}
