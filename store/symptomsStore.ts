import { create } from 'zustand';
import { Storage, STORAGE_KEYS } from '@/utils/storage';
import { generateId } from '@/utils/dateHelpers';
import { BUILTIN_SYMPTOMS, SYMPTOM_COLOR_PALETTE, FALLBACK_SYMPTOM } from '@/constants/symptoms';
import type { SymptomDef } from '@/types';

const MAX_CUSTOM = 12;

const defaultSymptoms = (): SymptomDef[] =>
  BUILTIN_SYMPTOMS.map((s) => ({ ...s, enabled: true }));

// Merge stored config with the built-in catalog so newly-shipped built-ins always
// appear and their icon/color/label stay current, while preserving the user's
// enabled toggles and any custom symptoms (kept after the built-ins).
function mergeWithBuiltins(stored: SymptomDef[]): SymptomDef[] {
  const byKey = new Map(stored.map((s) => [s.key, s]));
  const builtins = BUILTIN_SYMPTOMS.map((b) => {
    const prev = byKey.get(b.key);
    return { ...b, enabled: prev ? prev.enabled : true };
  });
  const custom = stored.filter((s) => !s.builtIn);
  return [...builtins, ...custom];
}

interface SymptomsStore {
  symptoms: SymptomDef[];
  isLoaded: boolean;
  loadSymptoms: () => void;
  addCustom: (label: string, icon: string) => void;
  removeCustom: (key: string) => void;
  toggleEnabled: (key: string) => void;
  resetSymptoms: () => void;
}

export const useSymptomsStore = create<SymptomsStore>((set, get) => ({
  symptoms: defaultSymptoms(),
  isLoaded: false,

  loadSymptoms: () => {
    const stored = Storage.getObject<SymptomDef[]>(STORAGE_KEYS.SYMPTOMS);
    set({
      symptoms: stored && stored.length ? mergeWithBuiltins(stored) : defaultSymptoms(),
      isLoaded: true,
    });
  },

  addCustom: (label, icon) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const current = get().symptoms;
    if (current.filter((s) => !s.builtIn).length >= MAX_CUSTOM) return;

    const customCount = current.filter((s) => !s.builtIn).length;
    const color = SYMPTOM_COLOR_PALETTE[customCount % SYMPTOM_COLOR_PALETTE.length];
    const next: SymptomDef = {
      key: `custom_${generateId()}`,
      label: trimmed,
      icon,
      color,
      builtIn: false,
      enabled: true,
    };
    const updated = [...current, next];
    Storage.setObject(STORAGE_KEYS.SYMPTOMS, updated);
    set({ symptoms: updated });
  },

  removeCustom: (key) => {
    // Built-ins can only be hidden, never removed.
    const updated = get().symptoms.filter((s) => s.builtIn || s.key !== key);
    Storage.setObject(STORAGE_KEYS.SYMPTOMS, updated);
    set({ symptoms: updated });
  },

  toggleEnabled: (key) => {
    const updated = get().symptoms.map((s) =>
      s.key === key ? { ...s, enabled: !s.enabled } : s,
    );
    Storage.setObject(STORAGE_KEYS.SYMPTOMS, updated);
    set({ symptoms: updated });
  },

  resetSymptoms: () => {
    Storage.delete(STORAGE_KEYS.SYMPTOMS);
    set({ symptoms: defaultSymptoms() });
  },
}));

// Resolve a symptom key to its display meta. Falls back gracefully for entries
// that reference a custom symptom the user later deleted.
export function resolveSymptomMeta(
  symptoms: SymptomDef[],
  key: string,
): { label: string; icon: string; color: string } {
  const found = symptoms.find((s) => s.key === key);
  if (found) return { label: found.label, icon: found.icon, color: found.color };
  return { ...FALLBACK_SYMPTOM };
}
