import { memo, useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  format, parseISO, differenceInDays, isSameMonth, startOfMonth, endOfMonth, eachDayOfInterval,
} from 'date-fns';
import BottomSheet from '@/components/ui/BottomSheet';
import LogEntryForm from '@/components/history/LogEntryForm';
import { useLogStore } from '@/store/logStore';
import { useSettingsStore } from '@/store/settingsStore';
import { formatMonthYear } from '@/utils/dateHelpers';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';
import type { LogEntry, CyclePhase, MoodType } from '@/types';

const TITLE = '#1E1B4B';

const FLOW_META: Record<string, { label: string; color: string }> = {
  light:    { label: 'Light Flow',    color: '#EC4899' },
  medium:   { label: 'Medium Flow',   color: '#EC4899' },
  heavy:    { label: 'Heavy Flow',    color: '#DB2777' },
  spotting: { label: 'Spotting',      color: '#9F1239' },
};

const PHASE_META: Record<CyclePhase, { label: string; color: string; icon: string }> = {
  period:    { label: 'Period Day',     color: '#EC4899', icon: 'water' },
  fertile:   { label: 'Fertile Window', color: '#16A34A', icon: 'leaf' },
  ovulation: { label: 'Ovulation Day',  color: '#7C5CFC', icon: 'ellipse' },
  normal:    { label: 'Logged Entry',   color: COLORS.textSecondary, icon: 'document-text' },
};

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: '😄', calm: '😌', normal: '😐', sad: '😟', irritable: '😠',
};

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

export default function HistoryScreen() {
  const router = useRouter();
  const entries = useLogStore((s) => s.entries);
  const deleteEntry = useLogStore((s) => s.deleteEntry);
  const settings = useSettingsStore((s) => s.settings);
  const [editEntry, setEditEntry] = useState<LogEntry | null>(null);

  const grouped = useMemo(() => {
    const groups: Record<string, LogEntry[]> = {};
    [...entries]
      .sort((a, b) => b.date.localeCompare(a.date))
      .forEach((e) => {
        const month = formatMonthYear(e.date);
        groups[month] = [...(groups[month] ?? []), e];
      });
    return groups;
  }, [entries]);

  // This-month summary — real logged data + this month's cycle days
  const summary = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEntries = entries.filter((e) => isSameMonth(parseISO(e.date), now));

    // Actually logged this month
    const periodDays = monthEntries.filter((e) => !!e.flow).length;
    const waterMl = monthEntries.reduce((sum, e) => sum + (e.waterIntake || 0), 0);

    // Cycle days that fall inside this month (from your cycle settings)
    let fertileDays = 0;
    let ovulationDays = 0;
    for (const d of eachDayOfInterval({ start: monthStart, end: endOfMonth(now) })) {
      const phase = phaseForDate(d, settings.lastPeriodDate, settings.cycleLength, settings.periodLength);
      if (phase === 'fertile') fertileDays++;
      else if (phase === 'ovulation') ovulationDays++;
    }

    return {
      periodDays,
      fertileDays,
      ovulationDays,
      waterL: (waterMl / 1000).toFixed(1),
      range: `${format(monthStart, 'MMM d')} – ${format(now, 'MMM d')}`,
    };
  }, [entries, settings]);

  const handleDelete = (id: string) =>
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(id) },
    ]);

  const renderEntry = (entry: LogEntry) => {
    const d = parseISO(entry.date);
    const phase = phaseForDate(d, settings.lastPeriodDate, settings.cycleLength, settings.periodLength);
    const flowMeta = entry.flow ? FLOW_META[entry.flow] : null;
    const phaseMeta = PHASE_META[phase];

    // Title: flow if logged, else phase
    const titleColor = flowMeta ? flowMeta.color : phaseMeta.color;
    const titleLabel = flowMeta ? flowMeta.label : phaseMeta.label;
    const titleIcon = flowMeta ? 'water' : phaseMeta.icon;

    // Accent rail color by phase, fallback flow
    const accent = phase !== 'normal' ? phaseMeta.color : flowMeta ? flowMeta.color : '#C4B5FD';
    const time = entry.createdAt ? format(new Date(entry.createdAt), 'h:mm a') : '';

    return (
      <TouchableOpacity
        key={entry.id}
        activeOpacity={0.85}
        onPress={() => setEditEntry(entry)}
        onLongPress={() => handleDelete(entry.id)}
        style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 18, marginBottom: 14, overflow: 'hidden', ...CARD_SHADOW }}
      >
        {/* Accent rail */}
        <View style={{ width: 5, backgroundColor: accent }} />

        {/* Date block */}
        <View style={{ width: 64, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 }}>
          <Text style={{ fontFamily: FONT.medium, fontSize: 11, color: COLORS.textSecondary, textTransform: 'uppercase' }}>
            {format(d, 'EEE')}
          </Text>
          <Text style={{ fontFamily: FONT.bold, fontSize: 26, color: accent, lineHeight: 30 }}>
            {format(d, 'd')}
          </Text>
          <Text style={{ fontFamily: FONT.medium, fontSize: 11, color: COLORS.textSecondary }}>
            {format(d, 'MMM')}
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingVertical: 14, paddingRight: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name={titleIcon as any} size={16} color={titleColor} />
              <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: titleColor }}>{titleLabel}</Text>
            </View>
            <Text style={{ fontFamily: FONT.regular, fontSize: 11, color: COLORS.textSecondary }}>{time}</Text>
          </View>

          {/* Metric pills */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {entry.symptoms.length > 0 && (
              <Pill icon="flash" iconColor={COLORS.primary} text={`${entry.symptoms.length}`} />
            )}
            {entry.mood && <Pill emoji={MOOD_EMOJI[entry.mood]} text="" />}
            {entry.waterIntake > 0 && (
              <Pill icon="water" iconColor="#3B82F6" text={`${entry.waterIntake} ml`} />
            )}
          </View>

          {/* Notes */}
          {entry.notes ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <Ionicons name="document-text-outline" size={14} color={COLORS.textSecondary} />
              <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: 13, color: '#4B5563' }} numberOfLines={1}>
                {entry.notes}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Chevron */}
        <View style={{ justifyContent: 'center', paddingRight: 12 }}>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FBF4FA' }}>
      {/* Header */}
      <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
        <Text style={{ fontFamily: FONT.bold, fontSize: 24, color: TITLE }}>History</Text>
        <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>Your logged entries</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}>
        {Object.keys(grouped).length === 0 ? (
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
            <Text style={{ fontFamily: FONT.semiBold, fontSize: 16, color: TITLE, marginBottom: 6 }}>No entries yet</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 14, color: COLORS.textSecondary }}>Start logging your symptoms daily.</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([month, monthEntries]) => (
            <View key={month} style={{ paddingHorizontal: 20 }}>
              <Text style={{ fontFamily: FONT.bold, fontSize: 20, color: TITLE, marginTop: 12, marginBottom: 12 }}>{month}</Text>
              {monthEntries.map(renderEntry)}
            </View>
          ))
        )}

        {/* Summary card */}
        {entries.length > 0 && (
          <LinearGradient colors={['#F3EAFB', '#F8EEF6']} style={{ marginHorizontal: 20, borderRadius: 24, padding: 18, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="reader" size={26} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE }}>Your This Month Summary</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>{summary.range}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/insights')}>
                <LinearGradient colors={['#8B5CF6', '#C084FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 }}>
                  <Text style={{ fontFamily: FONT.semiBold, fontSize: 12, color: '#FFFFFF' }}>View Insights</Text>
                  <Ionicons name="chevron-forward" size={13} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row' }}>
              {[
                { icon: 'water', color: '#EC4899', value: `${summary.periodDays}`, label: 'Period Days' },
                { icon: 'leaf', color: '#16A34A', value: `${summary.fertileDays}`, label: 'Fertile Days' },
                { icon: 'ellipse', color: '#7C5CFC', value: `${summary.ovulationDays}`, label: 'Ovulation Days' },
                { icon: 'water', color: '#3B82F6', value: `${summary.waterL} L`, label: 'Water Intake' },
              ].map((s, i) => (
                <View key={s.label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i > 0 ? 1 : 0, borderLeftColor: '#E6DAF0' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name={s.icon as any} size={15} color={s.color} />
                    <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: TITLE }}>{s.value}</Text>
                  </View>
                  <Text style={{ fontFamily: FONT.regular, fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 }}>{s.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        )}
      </ScrollView>

      <BottomSheet visible={!!editEntry} onClose={() => setEditEntry(null)} snapHeight={640}>
        {editEntry && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: TITLE, marginBottom: 12 }}>
              {format(parseISO(editEntry.date), 'EEEE, d MMM yyyy')}
            </Text>
            <LogEntryForm
              key={editEntry.id}
              date={editEntry.date}
              onSave={() => setEditEntry(null)}
              onClose={() => setEditEntry(null)}
            />
          </ScrollView>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const Pill = memo(function Pill({ icon, iconColor, emoji, text }: { icon?: string; iconColor?: string; emoji?: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#F3EEF8', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 }}>
      {emoji ? <Text style={{ fontSize: 14 }}>{emoji}</Text> : icon ? <Ionicons name={icon as any} size={14} color={iconColor} /> : null}
      {text ? <Text style={{ fontFamily: FONT.semiBold, fontSize: 12, color: TITLE }}>{text}</Text> : null}
    </View>
  );
});
