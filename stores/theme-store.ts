import { getDatabase } from "@/lib/database";
import { Appearance } from "react-native";
import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  themeMode: ThemeMode;
  effectiveColorScheme: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  initializeTheme: () => void;
}

// Simple key-value storage using SQLite (already available in the app)
const sqliteStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const db = await getDatabase();
      const result = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM kv_store WHERE key = ?",
        [name],
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
        "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?, ?)",
        [name, value],
      );
    } catch {
      // Ignore errors
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      const db = await getDatabase();
      await db.runAsync("DELETE FROM kv_store WHERE key = ?", [name]);
    } catch {
      // Ignore errors
    }
  },
};

function getSystemColorScheme(): "light" | "dark" {
  return Appearance.getColorScheme() || "light";
}

function computeEffectiveColorScheme(themeMode: ThemeMode): "light" | "dark" {
  if (themeMode === "system") {
    return getSystemColorScheme();
  }
  return themeMode;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: "system",
      effectiveColorScheme: getSystemColorScheme(),

      setThemeMode: (themeMode) => {
        const effectiveColorScheme = computeEffectiveColorScheme(themeMode);
        set({ themeMode, effectiveColorScheme });
      },

      initializeTheme: () => {
        const { themeMode } = get();
        const effectiveColorScheme = computeEffectiveColorScheme(themeMode);
        set({ effectiveColorScheme });

        // Listen for system theme changes
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
          const currentMode = get().themeMode;
          if (currentMode === "system") {
            set({ effectiveColorScheme: colorScheme || "light" });
          }
        });

        // Return cleanup function (though it won't be used in this context)
        return () => subscription.remove();
      },
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => sqliteStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, compute the effective color scheme
        if (state) {
          state.effectiveColorScheme = computeEffectiveColorScheme(
            state.themeMode,
          );
        }
      },
    },
  ),
);
