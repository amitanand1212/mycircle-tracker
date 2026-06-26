import type { SymptomDef } from '@/types';

// The default symptom catalog. These can be hidden by the user but never deleted,
// so old log entries that reference them always resolve to a label/icon/color.
export const BUILTIN_SYMPTOMS: Omit<SymptomDef, 'enabled'>[] = [
  { key: 'cramps',           label: 'Cramps',            icon: 'flash-outline',           color: '#EC4899', builtIn: true },
  { key: 'headache',         label: 'Headache',          icon: 'pulse-outline',           color: '#A855F7', builtIn: true },
  { key: 'backPain',         label: 'Back Pain',         icon: 'body-outline',            color: '#F472B6', builtIn: true },
  { key: 'bloating',         label: 'Bloating',          icon: 'ellipse-outline',         color: '#34D399', builtIn: true },
  { key: 'acne',             label: 'Acne',              icon: 'happy-outline',           color: '#60A5FA', builtIn: true },
  { key: 'fatigue',          label: 'Fatigue',           icon: 'battery-half-outline',    color: '#FBBF24', builtIn: true },
  { key: 'nausea',           label: 'Nausea',            icon: 'medkit-outline',          color: '#A78BFA', builtIn: true },
  { key: 'breastTenderness', label: 'Breast Tenderness', icon: 'radio-button-on-outline', color: '#FB7185', builtIn: true },
];

// Ionicons offered when creating a custom symptom.
export const SYMPTOM_ICON_CHOICES: string[] = [
  'sad-outline',
  'thermometer-outline',
  'bandage-outline',
  'bed-outline',
  'fast-food-outline',
  'wine-outline',
  'moon-outline',
  'sunny-outline',
  'heart-outline',
  'leaf-outline',
  'fitness-outline',
  'snow-outline',
  'rainy-outline',
  'cafe-outline',
  'walk-outline',
  'flame-outline',
];

// Colors auto-assigned to custom symptoms, cycled by creation order.
export const SYMPTOM_COLOR_PALETTE: string[] = [
  '#EC4899',
  '#A855F7',
  '#34D399',
  '#60A5FA',
  '#FBBF24',
  '#F472B6',
  '#A78BFA',
  '#FB7185',
];

// Used when a log entry references a symptom that has since been deleted.
export const FALLBACK_SYMPTOM = { label: 'Symptom', icon: 'ellipse-outline', color: '#9CA3AF' };
