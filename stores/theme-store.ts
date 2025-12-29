import { getDatabase } from '@/lib/database';
import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  getEffectiveColorScheme: () => 'light' | 'dark';
}

// Simple key-value storage using SQLite (already available in the app)
const sqliteStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM kv_store WHERE key = ?',
        [name]
      );
      return result?.value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.runAsync(
        'INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)',
        [name, value]
      );
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.runAsync('DELETE FROM kv_store WHERE key = ?', [name]);
    } catch {
      // Ignore errors
    }
  },
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',

      setThemeMode: (themeMode) => set({ themeMode }),

      getEffectiveColorScheme: () => {
        const { themeMode } = get();
        if (themeMode === 'system') {
          return Appearance.getColorScheme() || 'light';
        }
        return themeMode;
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => sqliteStorage),
    }
  )
);
