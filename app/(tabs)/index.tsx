import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Linking, RefreshControl, StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { Appbar, FAB, IconButton, Snackbar, useTheme } from 'react-native-paper';

import { AppListItem, EmptyState, FilterChips, SearchBar, SortMenu } from '@/components/ui';
import { getAllListedPackageNames } from '@/lib/repository';
import type { AppInfo } from '@/modules/installed-apps';
import InstalledAppsModule from '@/modules/installed-apps';
import { useAppsStore } from '@/stores';

export default function AppsScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const {
    isLoading,
    filter,
    sortField,
    sortReverse,
    searchQuery,
    excludeListed,
    selectedPackages,
    isSelectionMode,
    setApps,
    setLoading,
    setLastRefresh,
    setFilter,
    setSortField,
    toggleSortReverse,
    setSearchQuery,
    setExcludeListed,
    setListedPackages,
    toggleSelection,
    selectAll,
    clearSelection,
    getFilteredApps,
  } = useAppsStore();

  const filteredApps = getFilteredApps();

  const loadApps = useCallback(async () => {
    try {
      setLoading(true);
      const apps = await InstalledAppsModule.getInstalledApps(true, true);
      setApps(apps);
      setLastRefresh(Date.now());

      const listedPkgs = await getAllListedPackageNames();
      setListedPackages(listedPkgs);
    } catch (error) {
      console.error('Failed to load apps:', error);
      setSnackbarMessage('Failed to load apps');
    } finally {
      setLoading(false);
    }
  }, [setApps, setLoading, setLastRefresh, setListedPackages]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadApps();
    setRefreshing(false);
  }, [loadApps]);

  const handleAppPress = useCallback(
    (app: AppInfo) => {
      if (isSelectionMode) {
        toggleSelection(app.packageName);
      } else {
        const playStoreUrl = `https://play.google.com/store/apps/details?id=${app.packageName}`;
        Linking.openURL(playStoreUrl).catch(() => {
          setSnackbarMessage('Could not open Play Store');
        });
      }
    },
    [isSelectionMode, toggleSelection]
  );

  const handleAppLongPress = useCallback(
    (app: AppInfo) => {
      toggleSelection(app.packageName);
    },
    [toggleSelection]
  );

  const handleAddToList = useCallback(() => {
    if (selectedPackages.size === 0) return;
    router.push({
      pathname: '/add-to-list',
      params: { packages: Array.from(selectedPackages).join(',') },
    });
  }, [selectedPackages, router]);

  const renderItem = useCallback(
    ({ item }: { item: AppInfo }) => (
      <AppListItem
        app={item}
        isSelected={selectedPackages.has(item.packageName)}
        isSelectionMode={isSelectionMode}
        showStatus
        onPress={() => handleAppPress(item)}
        onLongPress={() => handleAppLongPress(item)}
      />
    ),
    [selectedPackages, isSelectionMode, handleAppPress, handleAppLongPress]
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        {isSelectionMode ? (
          <>
            <Appbar.Action icon="close" onPress={clearSelection} />
            <Appbar.Content title={`${selectedPackages.size} selected`} />
            <Appbar.Action
              icon="select-all"
              onPress={() => selectAll(filteredApps.map((a) => a.packageName))}
            />
          </>
        ) : (
          <>
            <Appbar.Content title="Installed Apps" />
            <IconButton
              icon={excludeListed ? 'filter' : 'filter-outline'}
              onPress={() => setExcludeListed(!excludeListed)}
            />
            <SortMenu
              currentSort={sortField}
              isReversed={sortReverse}
              onSortChange={setSortField}
              onReverseToggle={toggleSortReverse}
            />
          </>
        )}
      </Appbar.Header>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      <FilterChips currentFilter={filter} onFilterChange={setFilter} />

      <FlashList
        data={filteredApps}
        renderItem={renderItem}
        keyExtractor={(item) => item.packageName}
        estimatedItemSize={80}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              icon="magnify"
              title="No apps found"
              description={searchQuery ? 'Try a different search term' : 'Pull to refresh'}
            />
          )
        }
      />

      {isSelectionMode && selectedPackages.size > 0 && (
        <FAB
          icon="playlist-plus"
          label="Add to List"
          onPress={handleAddToList}
          style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
          color={theme.colors.onPrimaryContainer}
        />
      )}

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
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
