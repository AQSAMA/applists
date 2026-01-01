import React, { useCallback, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import type { MD3Theme } from "react-native-paper";
import {
    Divider,
    IconButton,
    Switch,
    Text,
    TouchableRipple,
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
  const theme = useTheme<MD3Theme>();

  const openMenu = useCallback(() => setVisible(true), []);
  const closeMenu = useCallback(() => setVisible(false), []);

  const handleSortSelect = (value: SortField) => {
    onSortChange(value);
    closeMenu();
  };

  return (
    <View>
      <IconButton icon="sort" onPress={openMenu} />
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.overlay} onPress={closeMenu}>
          <Pressable
            style={[
              styles.bottomSheet,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handle} />
            <Text variant="titleMedium" style={styles.title}>
              Sort by
            </Text>
            {sortOptions.map((option) => (
              <TouchableRipple
                key={option.value}
                onPress={() => handleSortSelect(option.value)}
                style={styles.menuItem}
              >
                <View style={styles.menuItemContent}>
                  <Text
                    variant="bodyLarge"
                    style={[
                      { color: theme.colors.onSurface },
                      currentSort === option.value && {
                        color: theme.colors.primary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {currentSort === option.value && (
                    <IconButton
                      icon="check"
                      size={20}
                      iconColor={theme.colors.primary}
                    />
                  )}
                </View>
              </TouchableRipple>
            ))}
            <Divider style={styles.divider} />
            <View style={styles.reverseRow}>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurface }}
              >
                Reverse Order
              </Text>
              <Switch value={isReversed} onValueChange={onReverseToggle} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#888",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  title: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  divider: {
    marginVertical: 8,
  },
  reverseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
