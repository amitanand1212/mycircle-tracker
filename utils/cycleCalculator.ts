import {
  addDays,
  differenceInDays,
  parseISO,
  format,
  startOfDay,
} from 'date-fns';
import type { ComputedCycleData, CyclePhase, InsightData, LogEntry, UserSettings } from '@/types';

/**
 * The user only sets their period start once (at onboarding). To keep
 * predictions rolling forward without a "log new period" step, advance that
 * anchor by whole cycles until it lands on the current cycle's start (the most
 * recent expected period start on or before today).
 */
export function currentCycleAnchor(lastPeriodDate: string, cycleLength: number): string {
  const last = startOfDay(parseISO(lastPeriodDate));
  const today = startOfDay(new Date());
  const elapsed = differenceInDays(today, last);
  if (elapsed < cycleLength) return lastPeriodDate;
  const cyclesPassed = Math.floor(elapsed / cycleLength);
  return format(addDays(last, cyclesPassed * cycleLength), 'yyyy-MM-dd');
}

export function calculateNextPeriod(
  lastPeriodDate: string,
  cycleLength: number,
): string {
  return format(addDays(parseISO(lastPeriodDate), cycleLength), 'yyyy-MM-dd');
}

export function calculateOvulationDay(
  lastPeriodDate: string,
  cycleLength: number,
): string {
  const offset = cycleLength - 14;
  return format(addDays(parseISO(lastPeriodDate), offset), 'yyyy-MM-dd');
}

export function calculateFertileWindow(
  lastPeriodDate: string,
  cycleLength: number,
): { start: string; end: string } {
  const ovulation = parseISO(calculateOvulationDay(lastPeriodDate, cycleLength));
  return {
    start: format(addDays(ovulation, -5), 'yyyy-MM-dd'),
    end:   format(ovulation, 'yyyy-MM-dd'),
  };
}

export function getCurrentCycleDay(lastPeriodDate: string, cycleLength: number): number {
  const diff = differenceInDays(startOfDay(new Date()), startOfDay(parseISO(lastPeriodDate)));
  const dayInCycle = (((diff % cycleLength) + cycleLength) % cycleLength) + 1;
  return dayInCycle;
}

export function getCyclePhase(
  date: string,
  lastPeriodDate: string,
  cycleLength: number,
  periodLength: number,
): CyclePhase {
  const diff = differenceInDays(parseISO(date), parseISO(lastPeriodDate));
  // Project onto a single cycle so phases repeat every cycle, not just once.
  const cycleDay = (((diff % cycleLength) + cycleLength) % cycleLength) + 1;

  if (cycleDay <= periodLength) return 'period';

  const ovulationDay = cycleLength - 14;
  if (cycleDay === ovulationDay) return 'ovulation';
  if (cycleDay >= ovulationDay - 5 && cycleDay < ovulationDay) return 'fertile';

  return 'normal';
}

export function computeCycleData(
  lastPeriodDate: string,
  cycleLength: number,
  periodLength: number,
): ComputedCycleData {
  // Roll the onboarding anchor forward to the current cycle so predictions and
  // reminders advance automatically every cycle.
  const anchor         = currentCycleAnchor(lastPeriodDate, cycleLength);
  const today          = format(new Date(), 'yyyy-MM-dd');
  const currentDay     = getCurrentCycleDay(anchor, cycleLength);
  const nextPeriodDate = calculateNextPeriod(anchor, cycleLength);
  const ovulationDate  = calculateOvulationDay(anchor, cycleLength);
  const { start: fertileWindowStart, end: fertileWindowEnd } =
    calculateFertileWindow(anchor, cycleLength);
  const daysUntilNextPeriod = Math.max(
    0,
    differenceInDays(parseISO(nextPeriodDate), startOfDay(new Date())),
  );

  return {
    currentDay,
    currentPhase:      getCyclePhase(today, anchor, cycleLength, periodLength),
    nextPeriodDate,
    daysUntilNextPeriod,
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    totalCycleDays:      cycleLength,
    cycleProgressPercent: Math.min(100, (currentDay / cycleLength) * 100),
  };
}

export function generateCalendarMarkers(
  lastPeriodDate: string,
  cycleLength: number,
  periodLength: number,
  year: number,
  month: number,
): Record<string, { phase: CyclePhase }> {
  const markers: Record<string, { phase: CyclePhase }> = {};
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = format(new Date(year, month, day), 'yyyy-MM-dd');
    const phase   = getCyclePhase(dateStr, lastPeriodDate, cycleLength, periodLength);
    if (phase !== 'normal') {
      markers[dateStr] = { phase };
    }
  }
  return markers;
}

export function computeInsights(
  entries: LogEntry[],
  settings: UserSettings,
): InsightData {
  const moodDistribution: Partial<Record<string, number>> = {};
  const symptomFrequency: Partial<Record<string, number>> = {};

  entries.forEach((e) => {
    if (e.mood) {
      moodDistribution[e.mood] = (moodDistribution[e.mood] ?? 0) + 1;
    }
    e.symptoms.forEach((s) => {
      symptomFrequency[s] = (symptomFrequency[s] ?? 0) + 1;
    });
  });

  return {
    averageCycleLength:   settings.cycleLength,
    averagePeriodLength:  settings.periodLength,
    cyclesTracked:        Math.max(1, Math.floor(entries.length / settings.periodLength)),
    cycleLengthHistory:   [],
    periodLengthHistory:  [],
    moodDistribution,
    symptomFrequency,
  };
}
