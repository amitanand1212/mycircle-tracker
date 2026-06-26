import { create } from 'zustand';
import { computeCycleData } from '@/utils/cycleCalculator';
import type { ComputedCycleData } from '@/types';

interface CycleStore {
  cycleData: ComputedCycleData | null;
  recompute: (lastPeriodDate: string, cycleLength: number, periodLength: number) => void;
  clear: () => void;
}

export const useCycleStore = create<CycleStore>((set) => ({
  cycleData: null,

  recompute: (lastPeriodDate, cycleLength, periodLength) => {
    if (!lastPeriodDate) return;
    set({ cycleData: computeCycleData(lastPeriodDate, cycleLength, periodLength) });
  },

  clear: () => set({ cycleData: null }),
}));
