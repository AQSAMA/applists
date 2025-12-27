import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { Text, useTheme } from 'react-native-paper';
import { StatusColors } from '../../constants/paper-theme';

type StatusType = 'installed' | 'missing' | 'system';

interface StatusBadgeProps {
  status: StatusType;
  showLabel?: boolean;
}

const statusLabels: Record<StatusType, string> = {
  installed: 'Installed',
  missing: 'Missing',
  system: 'System',
};

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  const theme = useTheme<MD3Theme>();
  const color = StatusColors[status];

  return (
    <View style={[styles.container, { backgroundColor: `${color}20` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {showLabel && (
        <Text variant="labelSmall" style={[styles.label, { color }]}>
          {statusLabels[status]}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontWeight: '500',
  },
});
