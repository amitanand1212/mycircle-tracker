import { create } from 'zustand';
import { Storage, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/dateHelpers';
import type { LogEntry } from '@/types';

interface LogStore {
  entries: LogEntry[];
  isLoaded: boolean;
  loadEntries: () => void;
  addEntry: (entry: Omit<LogEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateEntry: (id: string, partial: Partial<LogEntry>) => void;
  deleteEntry: (id: string) => void;
  getEntryByDate: (date: string) => LogEntry | undefined;
  getEntriesByMonth: (year: number, month: number) => LogEntry[];
}

export const useLogStore = create<LogStore>((set, get) => ({
  entries: [],
  isLoaded: false,

  loadEntries: () => {
    const stored = Storage.getObject<LogEntry[]>(STORAGE_KEYS.LOG_ENTRIES);
    set({ entries: stored ?? [], isLoaded: true });
  },

  addEntry: (entry) => {
    const now = new Date().toISOString();
    const newEntry: LogEntry = { ...entry, id: generateId(), createdAt: now, updatedAt: now };
    const updated = [newEntry, ...get().entries];
    Storage.setObject(STORAGE_KEYS.LOG_ENTRIES, updated);
    set({ entries: updated });
  },

  updateEntry: (id, partial) => {
    const updated = get().entries.map((e) =>
      e.id === id ? { ...e, ...partial, updatedAt: new Date().toISOString() } : e,
    );
    Storage.setObject(STORAGE_KEYS.LOG_ENTRIES, updated);
    set({ entries: updated });
  },

  deleteEntry: (id) => {
    const updated = get().entries.filter((e) => e.id !== id);
    Storage.setObject(STORAGE_KEYS.LOG_ENTRIES, updated);
    set({ entries: updated });
  },

  getEntryByDate: (date) => get().entries.find((e) => e.date === date),

  getEntriesByMonth: (year, month) =>
    get().entries.filter((e) => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }),
}));
