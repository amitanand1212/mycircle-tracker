export interface UserSettings {
  name: string;
  lastPeriodDate: string;
  cycleLength: number;
  periodLength: number;
  periodReminders: boolean;
  ovulationReminders: boolean;
  waterReminders: boolean;
  logReminders: boolean;
  appLockEnabled: boolean;
  appLockType: 'pin' | 'biometric' | null;
  pin: string | null;
  onboardingComplete: boolean;
  createdAt: string;
}

export type FlowType = 'light' | 'medium' | 'heavy' | 'spotting';
export type MoodType = 'happy' | 'calm' | 'normal' | 'sad' | 'irritable';

export type BuiltInSymptom =
  | 'cramps'
  | 'headache'
  | 'backPain'
  | 'bloating'
  | 'acne'
  | 'fatigue'
  | 'nausea'
  | 'breastTenderness';

// Built-in keys keep autocomplete; user-created custom symptoms use arbitrary keys.
export type SymptomType = BuiltInSymptom | (string & {});

// A configurable symptom shown in the daily log. Built-ins can be hidden but
// not deleted; custom ones are user-created.
export interface SymptomDef {
  key: string;
  label: string;
  icon: string;
  color: string;
  builtIn: boolean;
  enabled: boolean;
}

export interface LogEntry {
  id: string;
  date: string;
  flow: FlowType | null;
  mood: MoodType | null;
  symptoms: SymptomType[];
  waterIntake: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type CyclePhase = 'period' | 'fertile' | 'ovulation' | 'normal';

export interface ComputedCycleData {
  currentDay: number;
  currentPhase: CyclePhase;
  nextPeriodDate: string;
  daysUntilNextPeriod: number;
  ovulationDate: string;
  fertileWindowStart: string;
  fertileWindowEnd: string;
  totalCycleDays: number;
  cycleProgressPercent: number;
}

export interface MonthlySummary {
  month: string;
  periodDays: number;
  fertileDays: number;
  ovulationDay: string | null;
  totalWaterIntake: number;
}

export interface InsightDataPoint {
  month: string;
  value: number;
}

export interface InsightData {
  averageCycleLength: number;
  averagePeriodLength: number;
  cyclesTracked: number;
  cycleLengthHistory: InsightDataPoint[];
  periodLengthHistory: InsightDataPoint[];
  moodDistribution: Partial<Record<MoodType, number>>;
  symptomFrequency: Partial<Record<SymptomType, number>>;
}
