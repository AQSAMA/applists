import { useEffect } from "react";
import { useThemeStore } from "@/stores/theme-store";

export function useColorScheme(): "light" | "dark" {
  const effectiveColorScheme = useThemeStore(
    (state) => state.effectiveColorScheme,
  );
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return effectiveColorScheme;
}
