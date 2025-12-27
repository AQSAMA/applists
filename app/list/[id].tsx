import { FlashList } from '@shopify/flash-list';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, RefreshControl, StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import {
    Appbar,
    Button,
    Dialog,
    Menu,
    Portal,
    Snackbar,
    Text,
    useTheme
} from 'react-native-paper';

import { AppListItem, EmptyState, SearchBar, StatusBadge } from '@/components/ui';
import type { AppList, ListApp } from '@/lib/repository';
import { getList, getListApps, removeAppsFromList } from '@/lib/repository';
import InstalledAppsModule from '@/modules/installed-apps';

export default function ListDetailScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const listId = parseInt(id || '0', 10);

  const [list, setList] = useState<AppList | null>(null);
  const [apps, setApps] = useState<ListApp[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  // Selection mode
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const isSelectionMode = selectedIds.size > 0;

  const loadData = useCallback(async () => {
    if (!listId) return;
    try {
      setIsLoading(true);
      const [listData, listApps] = await Promise.all([getList(listId), getListApps(listId)]);
      setList(listData);

      // Check installed status and load icons
      const appsWithStatus = await Promise.all(
        listApps.map(async (app) => {
          const isInstalled = InstalledAppsModule.isAppInstalled(app.packageName);
          let icon = app.icon;
          if (isInstalled && !icon) {
            icon = await InstalledAppsModule.getAppIcon(app.packageName);
          }
          return { ...app, icon, isInstalled };
        })
      );
      setApps(appsWithStatus as ListApp[]);
    } catch (error) {
      console.error('Failed to load list:', error);
      setSnackbarMessage('Failed to load list');
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
          setSnackbarMessage('Could not open Play Store');
        });
      }
    },
    [isSelectionMode]
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
      const packagesToRemove = apps.filter((a) => selectedIds.has(a.id)).map((a) => a.packageName);
      await removeAppsFromList(listId, packagesToRemove);
      setDeleteDialogVisible(false);
      setSelectedIds(new Set());
      await loadData();
      setSnackbarMessage(`${packagesToRemove.length} app(s) removed`);
    } catch (error) {
      console.error('Failed to remove apps:', error);
      setSnackbarMessage('Failed to remove apps');
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const filteredApps = searchQuery.trim()
    ? apps.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.packageName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : apps;

  const getAppStatus = (app: ListApp & { isInstalled?: boolean }) => {
    if (app.isSystem) return 'system';
    if (app.isInstalled === false) return 'missing';
    return 'installed';
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
    [selectedIds, isSelectionMode, handleAppPress, handleAppLongPress]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: list?.name || 'List',
          headerRight: () => (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  router.push({
                    pathname: '/add-to-list',
                    params: { listId: listId.toString() },
                  });
                }}
                title="Add Apps"
                leadingIcon="plus"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  // TODO: Export list
                }}
                title="Export"
                leadingIcon="export"
              />
            </Menu>
          ),
        }}
      />

      {isSelectionMode && (
        <View style={[styles.selectionBar, { backgroundColor: theme.colors.primaryContainer }]}>
          <Appbar.Action icon="close" onPress={clearSelection} />
          <Text variant="titleMedium" style={{ flex: 1, color: theme.colors.onPrimaryContainer }}>
            {selectedIds.size} selected
          </Text>
          <Appbar.Action icon="delete" onPress={() => setDeleteDialogVisible(true)} />
        </View>
      )}

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search in list..." />

      <View style={styles.statsRow}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {apps.length} apps
        </Text>
        {apps.some((a) => (a as ListApp & { isInstalled?: boolean }).isInstalled === false) && (
          <StatusBadge status="missing" />
        )}
      </View>

      <FlashList
        data={filteredApps}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        estimatedItemSize={80}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[theme.colors.primary]} />
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
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Remove Apps</Dialog.Title>
          <Dialog.Content>
            <Text>Remove {selectedIds.size} app(s) from this list?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleRemoveSelected} textColor={theme.colors.error}>
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snackbarMessage} onDismiss={() => setSnackbarMessage('')} duration={3000}>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
