import { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLogStore } from '@/store/logStore';
import { useSymptomsStore } from '@/store/symptomsStore';
import { COLORS, FONT, CARD_SHADOW } from '@/constants/theme';
import type { FlowType, MoodType, SymptomType } from '@/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const FLOW_OPTIONS: { value: FlowType; label: string; color: string }[] = [
  { value: 'light',    label: 'Light',    color: '#FBCFE8' },
  { value: 'medium',   label: 'Medium',   color: '#F472B6' },
  { value: 'heavy',    label: 'Heavy',    color: '#DB2777' },
  { value: 'spotting', label: 'Spotting', color: '#9F1239' },
];

const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string; bg: string }[] = [
  { value: 'happy',     label: 'Happy',     emoji: '😄', bg: '#BBF7D0' },
  { value: 'calm',      label: 'Calm',      emoji: '😌', bg: '#A7F3D0' },
  { value: 'normal',    label: 'Normal',    emoji: '😐', bg: '#FDE68A' },
  { value: 'sad',       label: 'Sad',       emoji: '😟', bg: '#DDD6FE' },
  { value: 'irritable', label: 'Irritable', emoji: '😠', bg: '#FDBA74' },
];

const WATER_MAX = 2400;
const WATER_STEP = 300;

function CheckBadge({ color = COLORS.primary }: { color?: string }) {
  return (
    <View
      style={{
        position: 'absolute', top: -6, right: -6,
        width: 22, height: 22, borderRadius: 11,
        backgroundColor: color, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#FFFFFF',
      }}
    >
      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
    </View>
  );
}

function FlowDrop({ color }: { color: string }) {
  return (
    <Svg width={26} height={32} viewBox="0 0 24 30">
      <Path
        d="M12 0 C12 0 2 12 2 19 a10 10 0 0 0 20 0 C22 12 12 0 12 0 Z"
        fill={color}
      />
    </Svg>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, padding: 16, marginBottom: 16, ...CARD_SHADOW }}>
      {children}
    </View>
  );
}

function SectionHeader({ title, hint, hintIcon }: { title: string; hint: string; hintIcon?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: COLORS.textPrimary }}>{title}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>{hint}</Text>
        {hintIcon && <Ionicons name="information-circle-outline" size={14} color={COLORS.textSecondary} />}
      </View>
    </View>
  );
}

export interface LogEntryFormHandle {
  save: () => void;
}

interface Props {
  date: string;
  onSave: () => void;
  onClose?: () => void;
  showSaveButton?: boolean;
}

const LogEntryForm = forwardRef<LogEntryFormHandle, Props>(
  ({ date, onSave, showSaveButton = true }, ref) => {
    const getEntryByDate = useLogStore((s) => s.getEntryByDate);
    const addEntry = useLogStore((s) => s.addEntry);
    const updateEntry = useLogStore((s) => s.updateEntry);
    const symptomOptions = useSymptomsStore((s) => s.symptoms.filter((x) => x.enabled));
    const existing = getEntryByDate(date);

    const [flow, setFlow] = useState<FlowType | null>(existing?.flow ?? null);
    const [mood, setMood] = useState<MoodType | null>(existing?.mood ?? null);
    const [symptoms, setSymptoms] = useState<SymptomType[]>(existing?.symptoms ?? []);
    const [water, setWater] = useState(existing?.waterIntake ?? 900);
    const [notes, setNotes] = useState(existing?.notes ?? '');

    const toggleSymptom = (s: SymptomType) =>
      setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

    const handleSave = () => {
      const payload = { date, flow, mood, symptoms, waterIntake: water, notes };
      if (existing) updateEntry(existing.id, payload);
      else addEntry(payload);
      onSave();
    };

    useImperativeHandle(ref, () => ({ save: handleSave }));

    const waterPct = Math.min(water / WATER_MAX, 1);

    return (
      <View>
        {/* ── Flow ── */}
        <SectionCard>
          <SectionHeader title="Flow" hint="Select your flow" hintIcon />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {FLOW_OPTIONS.map((o) => {
              const sel = flow === o.value;
              return (
                <TouchableOpacity
                  key={o.value}
                  activeOpacity={0.8}
                  onPress={() => setFlow(sel ? null : o.value)}
                  style={{
                    flex: 1, alignItems: 'center', paddingVertical: 16,
                    borderRadius: 16, borderWidth: 1.5,
                    borderColor: sel ? COLORS.periodRed : COLORS.border,
                    backgroundColor: sel ? '#FFF1F5' : '#FFFFFF',
                  }}
                >
                  {sel && <CheckBadge color={COLORS.periodRed} />}
                  {o.value === 'spotting' ? (
                    <View style={{ width: 26, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{ flexDirection: 'row', gap: 3, marginBottom: 3 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: o.color }} />
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: o.color }} />
                      </View>
                      <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: o.color }} />
                    </View>
                  ) : (
                    <FlowDrop color={o.color} />
                  )}
                  <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: COLORS.textPrimary, marginTop: 8 }}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── Mood ── */}
        <SectionCard>
          <SectionHeader title="Mood" hint="How are you feeling?" />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {MOOD_OPTIONS.map((o) => {
              const sel = mood === o.value;
              return (
                <TouchableOpacity
                  key={o.value}
                  activeOpacity={0.8}
                  onPress={() => setMood(sel ? null : o.value)}
                  style={{
                    alignItems: 'center', borderRadius: 16, padding: 6,
                    borderWidth: 1.5, borderColor: sel ? COLORS.primary : 'transparent',
                    backgroundColor: sel ? '#FAF5FF' : 'transparent',
                  }}
                >
                  {sel && <CheckBadge />}
                  <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: o.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 24 }}>{o.emoji}</Text>
                  </View>
                  <Text style={{ fontFamily: FONT.medium, fontSize: 11, color: COLORS.textPrimary, marginTop: 6 }}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── Symptoms ── */}
        <SectionCard>
          <SectionHeader title="Symptoms" hint="Select all that apply" />
          {symptomOptions.length === 0 ? (
            <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary, paddingVertical: 8 }}>
              No symptoms enabled. Add or turn some on in Settings → Flow & Symptoms.
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {symptomOptions.map((o) => {
                const sel = symptoms.includes(o.key);
                return (
                  <TouchableOpacity
                    key={o.key}
                    activeOpacity={0.8}
                    onPress={() => toggleSymptom(o.key)}
                    style={{
                      width: '47%', alignItems: 'center', paddingVertical: 14,
                      borderRadius: 16, borderWidth: 1.5,
                      borderColor: sel ? COLORS.primary : COLORS.border,
                      backgroundColor: sel ? '#FAF5FF' : '#FFFFFF',
                    }}
                  >
                    {sel && <CheckBadge />}
                    <Ionicons name={o.icon as IconName} size={24} color={sel ? COLORS.primary : COLORS.textSecondary} />
                    <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: COLORS.textPrimary, marginTop: 8, textAlign: 'center' }}>
                      {o.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </SectionCard>

        {/* ── Notes ── */}
        <SectionCard>
          <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: COLORS.textPrimary, marginBottom: 12 }}>
            Notes <Text style={{ fontFamily: FONT.regular, fontSize: 12, color: COLORS.textSecondary }}>(Optional)</Text>
          </Text>
          <View style={{ borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16, padding: 14 }}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write anything you want to note..."
              placeholderTextColor={COLORS.textSecondary}
              multiline
              maxLength={200}
              style={{ fontFamily: FONT.regular, fontSize: 14, color: COLORS.textPrimary, minHeight: 70, textAlignVertical: 'top' }}
            />
            <Text style={{ fontFamily: FONT.regular, fontSize: 11, color: COLORS.textSecondary, textAlign: 'right', marginTop: 4 }}>
              {notes.length}/200
            </Text>
          </View>
        </SectionCard>

        {/* ── Water Intake ── */}
        <SectionCard>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="water" size={22} color="#3B82F6" />
              <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: COLORS.textPrimary }}>Water Intake</Text>
            </View>
            <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: COLORS.primary }}>
              {water} <Text style={{ fontFamily: FONT.regular, fontSize: 13, color: COLORS.textSecondary }}>/ {WATER_MAX} ml</Text>
            </Text>
          </View>

          {/* progress bar */}
          <View style={{ height: 10, borderRadius: 5, backgroundColor: COLORS.border, overflow: 'hidden', marginBottom: 16 }}>
            <View style={{ width: `${waterPct * 100}%`, height: '100%', borderRadius: 5, backgroundColor: COLORS.primary }} />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }}>
            <TouchableOpacity
              onPress={() => setWater((w) => Math.max(0, w - WATER_STEP))}
              style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="remove" size={20} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: COLORS.textPrimary, minWidth: 60, textAlign: 'center' }}>
              {WATER_STEP} ml
            </Text>
            <TouchableOpacity
              onPress={() => setWater((w) => Math.min(WATER_MAX, w + WATER_STEP))}
              style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="add" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </SectionCard>

        {/* ── Save ── */}
        {showSaveButton && (
          <TouchableOpacity activeOpacity={0.85} onPress={handleSave} style={{ marginTop: 4 }}>
            <View style={{ backgroundColor: COLORS.primary, borderRadius: 28, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, ...CARD_SHADOW }}>
              <Ionicons name="save-outline" size={20} color="#FFFFFF" />
              <Text style={{ fontFamily: FONT.semiBold, fontSize: 16, color: '#FFFFFF' }}>Save Entry</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

LogEntryForm.displayName = 'LogEntryForm';
export default LogEntryForm;
