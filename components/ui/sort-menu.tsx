import React, { useCallback, useRef, useState } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import type { MD3Theme } from "react-native-paper";
import {
  Divider,
  IconButton,
  Menu,
  Portal,
  Switch,
  Text,
  useTheme,
} from "react-native-paper";
import type { SortField } from "../../stores/apps-store";

interface SortMenuProps {
  currentSort: SortField;
  isReversed: boolean;
  onSortChange: (field: SortField) => void;
  onReverseToggle: () => void;
}

const sortOptions: { label: string; value: SortField }[] = [
  { label: "Name", value: "name" },
  { label: "Package Name", value: "packageName" },
  { label: "Install Date", value: "installDate" },
  { label: "Update Date", value: "updateDate" },
  { label: "Size", value: "size" },
];

export function SortMenu({
  currentSort,
  isReversed,
  onSortChange,
  onReverseToggle,
}: SortMenuProps) {
  const [visible, setVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState({ x: 0, y: 0 });
  const theme = useTheme<MD3Theme>();
  const buttonRef = useRef<View>(null);

  const openMenu = useCallback(() => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((x, y, width, height) => {
        setMenuAnchor({ x: x + width, y: y + height });
        setVisible(true);
      });
    } else {
      // Fallback to right side of screen
      setMenuAnchor({ x: Dimensions.get("window").width - 16, y: 56 });
      setVisible(true);
    }
  }, []);

  const closeMenu = useCallback(() => setVisible(false), []);

  const handleSortSelect = (value: SortField) => {
    onSortChange(value);
    closeMenu();
  };

  return (
    <View ref={buttonRef} collapsable={false}>
      <IconButton icon="sort" onPress={openMenu} />
      <Portal>
        <Menu
          visible={visible}
          onDismiss={closeMenu}
          anchor={menuAnchor}
          anchorPosition="bottom"
          contentStyle={styles.menuContent}
        >
          {sortOptions.map((option) => (
            <Menu.Item
              key={option.value}
              onPress={() => handleSortSelect(option.value)}
              title={option.label}
              leadingIcon={currentSort === option.value ? "check" : undefined}
            />
          ))}
          <Divider />
          <View style={styles.reverseRow}>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurface }}
            >
              Reverse Order
            </Text>
            <Switch value={isReversed} onValueChange={onReverseToggle} />
          </View>
        </Menu>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  menuContent: {
    minWidth: 200,
  },
  reverseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
