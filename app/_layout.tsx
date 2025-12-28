import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { DarkTheme, LightTheme } from '@/constants/paper-theme';
import { useThemeStore } from '@/stores';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { themeMode, getEffectiveColorScheme } = useThemeStore();
  const [colorScheme, setColorScheme] = useState(getEffectiveColorScheme());

  useEffect(() => {
    // Update when themeMode changes
    setColorScheme(getEffectiveColorScheme());
  }, [themeMode, getEffectiveColorScheme]);

  useEffect(() => {
    // Listen to system appearance changes when in 'system' mode
    const subscription = Appearance.addChangeListener(() => {
      if (themeMode === 'system') {
        setColorScheme(getEffectiveColorScheme());
      }
    });
    return () => subscription.remove();
  }, [themeMode, getEffectiveColorScheme]);

  const theme = colorScheme === 'dark' ? DarkTheme : LightTheme;

  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="list/[id]" options={{ title: 'List Details' }} />
        <Stack.Screen name="collection/[id]" options={{ title: 'Collection' }} />
        <Stack.Screen name="add-to-list" options={{ presentation: 'modal', title: 'Add to List' }} />
      </Stack>
      <StatusBar style="auto" />
    </PaperProvider>
  );
}
