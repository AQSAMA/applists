import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { Divider, IconButton, Menu, Switch, Text, useTheme } from 'react-native-paper';
import type { SortField } from '../../stores/apps-store';

interface SortMenuProps {
  currentSort: SortField;
  isReversed: boolean;
  onSortChange: (field: SortField) => void;
  onReverseToggle: () => void;
}

const sortOptions: { label: string; value: SortField }[] = [
  { label: 'Name', value: 'name' },
  { label: 'Package Name', value: 'packageName' },
  { label: 'Install Date', value: 'installDate' },
  { label: 'Update Date', value: 'updateDate' },
  { label: 'Size', value: 'size' },
];

export function SortMenu({ currentSort, isReversed, onSortChange, onReverseToggle }: SortMenuProps) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme<MD3Theme>();

  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  const handleSortSelect = (value: SortField) => {
    onSortChange(value);
    closeMenu();
  };

  return (
    <Menu
      visible={visible}
      onDismiss={closeMenu}
      anchor={
        <IconButton
          icon="sort"
          onPress={openMenu}
        />
      }
      contentStyle={styles.menuContent}
    >
      {sortOptions.map((option) => (
        <Menu.Item
          key={option.value}
          onPress={() => handleSortSelect(option.value)}
          title={option.label}
          leadingIcon={currentSort === option.value ? 'check' : undefined}
        />
      ))}
      <Divider />
      <View style={styles.reverseRow}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
          Reverse Order
        </Text>
        <Switch value={isReversed} onValueChange={onReverseToggle} />
      </View>
    </Menu>
  );
}

const styles = StyleSheet.create({
  menuContent: {
    minWidth: 200,
  },
  reverseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
