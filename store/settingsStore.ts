import { create } from 'zustand';
import { Storage, STORAGE_KEYS } from '@/utils/storage';
import type { UserSettings } from '@/types';

const DEFAULT_SETTINGS: UserSettings = {
  name:                '',
  lastPeriodDate:      '',
  cycleLength:         28,
  periodLength:        5,
  periodReminders:     true,
  ovulationReminders:  true,
  waterReminders:      true,
  logReminders:        true,
  appLockEnabled:      false,
  appLockType:         null,
  pin:                 null,
  onboardingComplete:  false,
  createdAt:           new Date().toISOString(),
};

interface SettingsStore {
  settings: UserSettings;
  isLoaded: boolean;
  loadSettings: () => void;
  updateSettings: (partial: Partial<UserSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  loadSettings: () => {
    const stored = Storage.getObject<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
    set({
      settings: stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS,
      isLoaded: true,
    });
  },

  updateSettings: (partial) => {
    const updated = { ...get().settings, ...partial };
    Storage.setObject(STORAGE_KEYS.USER_SETTINGS, updated);
    set({ settings: updated });
  },

  resetSettings: () => {
    Storage.delete(STORAGE_KEYS.USER_SETTINGS);
    set({ settings: { ...DEFAULT_SETTINGS, createdAt: new Date().toISOString() } });
  },
}));
