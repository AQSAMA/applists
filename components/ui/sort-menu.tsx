import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Divider, IconButton, Menu } from 'react-native-paper';
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

  const handleReverseToggle = () => {
    onReverseToggle();
    // Don't close menu on reverse toggle - better UX
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
      <Menu.Item
        title="Reverse Order"
        leadingIcon={isReversed ? 'check' : undefined}
        onPress={handleReverseToggle}
      />
    </Menu>
  );
}

const styles = StyleSheet.create({
  menuContent: {
    minWidth: 200,
  },
});
