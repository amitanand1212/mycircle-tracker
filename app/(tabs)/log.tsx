import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { addDays, format, isToday, isSameDay, parseISO, startOfWeek } from 'date-fns';
import LogEntryForm, { type LogEntryFormHandle } from '@/components/history/LogEntryForm';
import { useLogStore } from '@/store/logStore';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';
import { toISODateString, todayISO } from '@/utils/dateHelpers';

export default function LogScreen() {
  const router = useRouter();
  const formRef = useRef<LogEntryFormHandle>(null);
  const entries = useLogStore((s) => s.entries);

  const [selected, setSelected] = useState(todayISO());
  const selectedDate = parseISO(selected);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const hasEntry = (d: Date) => entries.some((e) => isSameDay(parseISO(e.date), d));

  const dateLabel = isToday(selectedDate)
    ? `Today, ${format(selectedDate, 'd MMM yyyy')}`
    : format(selectedDate, 'd MMM yyyy');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF8FC' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}
          >
            <Ionicons name="chevron-back" size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <Text style={{ fontFamily: FONT.bold, fontSize: 20, color: COLORS.textPrimary }}>Log Symptoms</Text>

          <TouchableOpacity
            onPress={() => formRef.current?.save()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}
          >
            <Ionicons name="checkmark" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* ── Date navigation ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => setSelected(todayISO())}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}
          >
            <Ionicons name="calendar-outline" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 17, color: COLORS.textPrimary }}>{dateLabel}</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary }}>{format(selectedDate, 'EEEE')}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setSelected(toISODateString(addDays(selectedDate, 1)))}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...CARD_SHADOW }}
          >
            <Ionicons name="chevron-forward" size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* ── Week strip ── */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 6, marginBottom: 8 }}>
          {weekDays.map((d) => {
            const iso = toISODateString(d);
            const sel = iso === selected;
            return (
              <TouchableOpacity
                key={iso}
                activeOpacity={0.8}
                onPress={() => setSelected(iso)}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: 10,
                  borderRadius: 16,
                  backgroundColor: sel ? COLORS.primary : '#FFFFFF',
                  borderWidth: sel ? 0 : 1, borderColor: COLORS.border,
                  ...(sel ? CARD_SHADOW : {}),
                }}
              >
                <Text style={{ fontFamily: FONT.medium, fontSize: 11, color: sel ? 'rgba(255,255,255,0.85)' : COLORS.textSecondary }}>
                  {format(d, 'EEE')}
                </Text>
                <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: sel ? '#FFFFFF' : COLORS.textPrimary, marginVertical: 2 }}>
                  {format(d, 'd')}
                </Text>
                <View
                  style={{
                    width: 5, height: 5, borderRadius: 3,
                    backgroundColor: hasEntry(d)
                      ? (sel ? '#FFFFFF' : COLORS.periodRed)
                      : (sel ? 'rgba(255,255,255,0.6)' : '#D1D5DB'),
                  }}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Form ── */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          <LogEntryForm
            key={selected}
            ref={formRef}
            date={selected}
            onSave={() => router.back()}
            onClose={() => router.back()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
