import { FlashList } from "@shopify/flash-list";
import { cacheDirectory, writeAsStringAsync } from "expo-file-system/legacy";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import type { MD3Theme } from "react-native-paper";
import {
  Appbar,
  Button,
  Dialog,
  IconButton,
  Portal,
  Snackbar,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

import {
  AppListItem,
  EmptyState,
  SearchBar,
  StatusBadge,
} from "@/components/ui";
import type { AppList, ListApp } from "@/lib/repository";
import {
  exportListData,
  getList,
  getListApps,
  removeAppsFromList,
  updateList,
} from "@/lib/repository";
import InstalledAppsModule from "@/modules/installed-apps";

export default function ListDetailScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listId = parseInt(id || "0", 10);

  const [list, setList] = useState<AppList | null>(null);
  const [apps, setApps] = useState<ListApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);

  // Selection mode
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Rename dialog
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [newName, setNewName] = useState("");

  const isSelectionMode = selectedIds.size > 0;

  const loadData = useCallback(async () => {
    if (!listId) return;
    try {
      setIsLoading(true);
      const [listData, listApps] = await Promise.all([
        getList(listId),
        getListApps(listId),
      ]);
      setList(listData);

      // Check installed status and load icons
      const appsWithStatus = await Promise.all(
        listApps.map(async (app) => {
          const isInstalled = InstalledAppsModule.isAppInstalled(
            app.packageName,
          );
          let icon = app.icon;
          if (isInstalled && !icon) {
            icon = await InstalledAppsModule.getAppIcon(app.packageName);
          }
          return { ...app, icon, isInstalled };
        }),
      );
      setApps(appsWithStatus as ListApp[]);
    } catch (error) {
      console.error("Failed to load list:", error);
      setSnackbarMessage("Failed to load list");
    } finally {
      setIsLoading(false);
    }
  }, [listId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAppPress = useCallback(
    (app: ListApp) => {
      if (isSelectionMode) {
        setSelectedIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(app.id)) {
            newSet.delete(app.id);
          } else {
            newSet.add(app.id);
          }
          return newSet;
        });
      } else {
        const playStoreUrl = `https://play.google.com/store/apps/details?id=${app.packageName}`;
        Linking.openURL(playStoreUrl).catch(() => {
          setSnackbarMessage("Could not open Play Store");
        });
      }
    },
    [isSelectionMode],
  );

  const handleAppLongPress = useCallback((app: ListApp) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(app.id);
      return newSet;
    });
  }, []);

  const handleRemoveSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      const packagesToRemove = apps
        .filter((a) => selectedIds.has(a.id))
        .map((a) => a.packageName);
      await removeAppsFromList(listId, packagesToRemove);
      setDeleteDialogVisible(false);
      setSelectedIds(new Set());
      await loadData();
      setSnackbarMessage(`${packagesToRemove.length} app(s) removed`);
    } catch (error) {
      console.error("Failed to remove apps:", error);
      setSnackbarMessage("Failed to remove apps");
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportListData(listId);
      const fileName = `${list?.name?.replace(/[^a-z0-9]/gi, "_") || "list"}.json`;
      const filePath = `${cacheDirectory}${fileName}`;
      await writeAsStringAsync(filePath, JSON.stringify(data, null, 2));
      await Sharing.shareAsync(filePath, {
        mimeType: "application/json",
        dialogTitle: `Export ${list?.name || "List"}`,
      });
    } catch (error) {
      console.error("Failed to export list:", error);
      setSnackbarMessage("Failed to export list");
    }
  };

  const handleOpenRenameDialog = () => {
    setNewName(list?.name || "");
    setRenameDialogVisible(true);
    setMenuVisible(false);
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      setSnackbarMessage("Name cannot be empty");
      return;
    }
    try {
      await updateList(listId, newName.trim(), list?.description ?? undefined);
      setList((prev) => (prev ? { ...prev, name: newName.trim() } : null));
      setRenameDialogVisible(false);
      setSnackbarMessage("List renamed");
    } catch (error) {
      console.error("Failed to rename list:", error);
      setSnackbarMessage("Failed to rename list");
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const filteredApps = searchQuery.trim()
    ? apps.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.packageName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : apps;

  const getAppStatus = (app: ListApp & { isInstalled?: boolean }) => {
    if (app.isSystem) return "system";
    if (app.isInstalled === false) return "missing";
    return "installed";
  };

  const renderItem = useCallback(
    ({ item }: { item: ListApp & { isInstalled?: boolean } }) => (
      <AppListItem
        app={{ ...item, icon: item.icon || null }}
        isSelected={selectedIds.has(item.id)}
        isSelectionMode={isSelectionMode}
        showStatus
        status={getAppStatus(item)}
        onPress={() => handleAppPress(item)}
        onLongPress={() => handleAppLongPress(item)}
      />
    ),
    [selectedIds, isSelectionMode, handleAppPress, handleAppLongPress],
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: list?.name || "List",
          headerRight: () => (
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          ),
        }}
      />

      <Portal>
        <Modal
          visible={menuVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setMenuVisible(false)}
          >
            <Pressable
              style={[
                styles.bottomSheet,
                { backgroundColor: theme.colors.surface },
              ]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.handle} />
              <Text variant="titleMedium" style={styles.sheetTitle}>
                Options
              </Text>
              <TouchableRipple
                onPress={handleOpenRenameDialog}
                style={styles.sheetItem}
              >
                <View style={styles.sheetItemContent}>
                  <IconButton icon="pencil" size={24} />
                  <Text variant="bodyLarge">Rename</Text>
                </View>
              </TouchableRipple>
              <TouchableRipple
                onPress={() => {
                  setMenuVisible(false);
                  handleExport();
                }}
                style={styles.sheetItem}
              >
                <View style={styles.sheetItemContent}>
                  <IconButton icon="export" size={24} />
                  <Text variant="bodyLarge">Export</Text>
                </View>
              </TouchableRipple>
            </Pressable>
          </Pressable>
        </Modal>
      </Portal>

      <Portal>
        <Dialog
          visible={renameDialogVisible}
          onDismiss={() => setRenameDialogVisible(false)}
        >
          <Dialog.Title>Rename List</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Name"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleRename}>Rename</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {isSelectionMode && (
        <View
          style={[
            styles.selectionBar,
            { backgroundColor: theme.colors.primaryContainer },
          ]}
        >
          <Appbar.Action icon="close" onPress={clearSelection} />
          <Text
            variant="titleMedium"
            style={{ flex: 1, color: theme.colors.onPrimaryContainer }}
          >
            {selectedIds.size} selected
          </Text>
          <Appbar.Action
            icon="delete"
            onPress={() => setDeleteDialogVisible(true)}
          />
        </View>
      )}

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search in list..."
      />

      <View style={styles.statsRow}>
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {apps.length} apps
        </Text>
        {apps.some(
          (a) =>
            (a as ListApp & { isInstalled?: boolean }).isInstalled === false,
        ) && <StatusBadge status="missing" />}
      </View>

      <FlashList
        data={filteredApps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadData}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="format-list-bulleted"
              title="No apps in this list"
              description="Add apps from the Apps tab"
            />
          )
        }
      />

      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Remove Apps</Dialog.Title>
          <Dialog.Content>
            <Text>Remove {selectedIds.size} app(s) from this list?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={handleRemoveSelected}
              textColor={theme.colors.error}
            >
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar
        visible={!!snackbarMessage}
        onDismiss={() => setSnackbarMessage("")}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectionBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
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
  sheetTitle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sheetItem: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  sheetItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
});
