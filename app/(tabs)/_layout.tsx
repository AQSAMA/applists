import { Tabs } from 'expo-router';
import React from 'react';
import type { MD3Theme } from 'react-native-paper';
import { Icon, useTheme } from 'react-native-paper';

import { HapticTab } from '@/components/haptic-tab';

export default function TabLayout() {
  const theme = useTheme<MD3Theme>();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Apps',
          tabBarIcon: ({ color }) => <Icon source="apps" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color }) => <Icon source="format-list-bulleted" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="collections"
        options={{
          title: 'Collections',
          tabBarIcon: ({ color }) => <Icon source="folder-multiple" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Icon source="cog" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
