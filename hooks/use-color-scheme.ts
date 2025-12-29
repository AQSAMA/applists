import { useThemeStore } from '@/stores/theme-store';

export function useColorScheme(): 'light' | 'dark' {
    const getEffectiveColorScheme = useThemeStore((state) => state.getEffectiveColorScheme);
    return getEffectiveColorScheme();
}
