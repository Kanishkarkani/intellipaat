import * as SecureStore from 'expo-secure-store';

import type { Session } from '@/domain/models';

export interface SessionStorage {
  load(): Promise<Session | null>;
  save(session: Session): Promise<void>;
  clear(): Promise<void>;
}

const KEY = 'auth.session';

/** Keychain (iOS) / Keystore-backed EncryptedSharedPreferences (Android). Never AsyncStorage for tokens. */
export class SecureSessionStorage implements SessionStorage {
  async load() {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Session;
    } catch {
      await this.clear();
      return null;
    }
  }

  save(session: Session) {
    return SecureStore.setItemAsync(KEY, JSON.stringify(session), {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
    });
  }

  clear() {
    return SecureStore.deleteItemAsync(KEY);
  }
}
