import * as SecureStore from 'expo-secure-store';

type StorageBackend = {
  set(key: string, value: string | boolean): void;
  getString(key: string): string | undefined;
  getBoolean(key: string): boolean | undefined;
  delete(key: string): void;
  clearAll(): void;
};

// Alias under which the MMKV encryption key lives in the OS keystore/keychain.
const ENCRYPTION_KEY_ALIAS = 'mycircle.storage.key';

/** Generate a 256-bit key as a 64-char hex string. */
function generateEncryptionKey(): string {
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  }
  return key;
}

/**
 * Fetch the storage encryption key from the secure keystore, creating and
 * persisting one on first launch. The key never leaves the device's hardware-
 * backed keystore, so the on-disk MMKV file stays encrypted at rest.
 */
function getEncryptionKey(): string {
  let key = SecureStore.getItem(ENCRYPTION_KEY_ALIAS);
  if (!key) {
    key = generateEncryptionKey();
    SecureStore.setItem(ENCRYPTION_KEY_ALIAS, key);
  }
  return key;
}

function createStorage(): StorageBackend {
  // In-memory fallback for Expo Go (MMKV + SecureStore require a native build).
  try {
    const { MMKV } = require('react-native-mmkv');
    // New id ('-secure') so we never try to read the old unencrypted store with
    // a key, which would fail to decrypt.
    return new MMKV({ id: 'my-circle-secure', encryptionKey: getEncryptionKey() });
  } catch {
    const mem: Record<string, string | boolean> = {};
    return {
      set: (k, v) => { mem[k] = v; },
      getString: (k) => (typeof mem[k] === 'string' ? mem[k] as string : undefined),
      getBoolean: (k) => (typeof mem[k] === 'boolean' ? mem[k] as boolean : undefined),
      delete: (k) => { delete mem[k]; },
      clearAll: () => { Object.keys(mem).forEach(k => delete mem[k]); },
    };
  }
}

const storage = createStorage();

export const Storage = {
  setObject<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  },

  getObject<T>(key: string): T | null {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  setString(key: string, value: string): void {
    storage.set(key, value);
  },

  getString(key: string): string | null {
    return storage.getString(key) ?? null;
  },

  setBoolean(key: string, value: boolean): void {
    storage.set(key, value);
  },

  getBoolean(key: string): boolean {
    return storage.getBoolean(key) ?? false;
  },

  delete(key: string): void {
    storage.delete(key);
  },

  clearAll(): void {
    storage.clearAll();
  },
};

export const STORAGE_KEYS = {
  USER_SETTINGS: 'user_settings',
  LOG_ENTRIES:   'log_entries',
  SYMPTOMS:      'symptoms_config',
  APP_USAGE:     'app_usage',
  REVIEW_STATUS: 'review_status',
} as const;
