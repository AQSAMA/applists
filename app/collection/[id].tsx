import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { Appbar, FAB, Menu, Snackbar, Text, useTheme } from 'react-native-paper';

import { EmptyState, ListCard, SearchBar } from '@/components/ui';
import type { AppList, Collection } from '@/lib/repository';
import {
    addListToCollection,
    getAllLists,
    getCollection,
    getCollectionLists,
    removeListFromCollection,
} from '@/lib/repository';

export default function CollectionDetailScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const collectionId = parseInt(id || '0', 10);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [lists, setLists] = useState<AppList[]>([]);
  const [allLists, setAllLists] = useState<AppList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  const loadData = useCallback(async () => {
    if (!collectionId) return;
    try {
      setIsLoading(true);
      const [collectionData, collectionLists, all] = await Promise.all([
        getCollection(collectionId),
        getCollectionLists(collectionId),
        getAllLists(),
      ]);
      setCollection(collectionData);
      setLists(collectionLists);
      setAllLists(all);
    } catch (error) {
      console.error('Failed to load collection:', error);
      setSnackbarMessage('Failed to load collection');
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleListPress = (list: AppList) => {
    router.push(`/list/${list.id}`);
  };

  const handleAddList = async (listId: number) => {
    try {
      await addListToCollection(collectionId, listId);
      setAddMenuVisible(false);
      await loadData();
      setSnackbarMessage('List added to collection');
    } catch (error) {
      console.error('Failed to add list:', error);
      setSnackbarMessage('Failed to add list');
    }
  };

  const handleRemoveList = async (listId: number) => {
    try {
      await removeListFromCollection(collectionId, listId);
      await loadData();
      setSnackbarMessage('List removed from collection');
    } catch (error) {
      console.error('Failed to remove list:', error);
      setSnackbarMessage('Failed to remove list');
    }
  };

  const filteredLists = searchQuery.trim()
    ? lists.filter(
        (l) =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : lists;

  const availableLists = allLists.filter((l) => !lists.some((cl) => cl.id === l.id));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: collection?.name || 'Collection',
          headerRight: () => (
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
            >
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  // TODO: Export collection
                }}
                title="Export"
                leadingIcon="export"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  // TODO: Check duplicates
                }}
                title="Check Duplicates"
                leadingIcon="content-duplicate"
              />
            </Menu>
          ),
        }}
      />

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search lists..." />

      <View style={styles.statsRow}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {lists.length} lists
        </Text>
      </View>

      {filteredLists.length === 0 ? (
        <EmptyState
          icon="folder-multiple"
          title="No lists in this collection"
          description="Add lists to organize them together"
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {filteredLists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onPress={() => handleListPress(list)}
              onLongPress={() => handleRemoveList(list.id)}
            />
          ))}
        </ScrollView>
      )}

      <Menu
        visible={addMenuVisible}
        onDismiss={() => setAddMenuVisible(false)}
        anchor={
          <FAB
            icon="plus"
            onPress={() => setAddMenuVisible(true)}
            style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
            color={theme.colors.onPrimaryContainer}
          />
        }
        anchorPosition="top"
      >
        {availableLists.length === 0 ? (
          <Menu.Item title="No available lists" disabled />
        ) : (
          availableLists.map((list) => (
            <Menu.Item key={list.id} onPress={() => handleAddList(list.id)} title={list.name} />
          ))
        )}
      </Menu>

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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContainer: {
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
