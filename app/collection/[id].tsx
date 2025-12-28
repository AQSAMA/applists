import { cacheDirectory, writeAsStringAsync } from 'expo-file-system/legacy';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { Appbar, Button, Dialog, Divider, FAB, List, Menu, Portal, Snackbar, Text, useTheme } from 'react-native-paper';

import { EmptyState, ListCard, SearchBar } from '@/components/ui';
import type { AppList, Collection } from '@/lib/repository';
import {
    addListToCollection,
    exportCollectionData,
    findDuplicatesInCollection,
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
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [duplicatesDialogVisible, setDuplicatesDialogVisible] = useState(false);
  const [duplicates, setDuplicates] = useState<{ packageName: string; listNames: string[] }[]>([]);

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
      setAddDialogVisible(false);
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

  const handleExport = async () => {
    try {
      const data = await exportCollectionData(collectionId);
      const fileName = `${collection?.name?.replace(/[^a-z0-9]/gi, '_') || 'collection'}.json`;
      const filePath = `${cacheDirectory}${fileName}`;
      await writeAsStringAsync(filePath, JSON.stringify(data, null, 2));
      await Sharing.shareAsync(filePath, {
        mimeType: 'application/json',
        dialogTitle: `Export ${collection?.name || 'Collection'}`,
      });
    } catch (error) {
      console.error('Failed to export collection:', error);
      setSnackbarMessage('Failed to export collection');
    }
  };

  const handleCheckDuplicates = async () => {
    try {
      const duplicateMap = await findDuplicatesInCollection(collectionId);
      const listNameMap = new Map(lists.map((l) => [l.id, l.name]));
      
      const duplicateList = Array.from(duplicateMap.entries()).map(([packageName, listIds]) => ({
        packageName,
        listNames: listIds.map((id) => listNameMap.get(id) || `List ${id}`),
      }));
      
      setDuplicates(duplicateList);
      setDuplicatesDialogVisible(true);
    } catch (error) {
      console.error('Failed to check duplicates:', error);
      setSnackbarMessage('Failed to check duplicates');
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
                  handleExport();
                }}
                title="Export"
                leadingIcon="export"
              />
              <Menu.Item
                onPress={() => {
                  setMenuVisible(false);
                  handleCheckDuplicates();
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

      <FAB
        icon="plus"
        onPress={() => setAddDialogVisible(true)}
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
      />

      <Portal>
        <Dialog visible={addDialogVisible} onDismiss={() => setAddDialogVisible(false)}>
          <Dialog.Title>Add List to Collection</Dialog.Title>
          <Dialog.Content>
            {availableLists.length === 0 ? (
              <Text>No available lists to add.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {availableLists.map((list) => (
                  <List.Item
                    key={list.id}
                    title={list.name}
                    description={`${list.appCount || 0} apps`}
                    onPress={() => handleAddList(list.id)}
                    left={(props) => <List.Icon {...props} icon="format-list-bulleted" />}
                  />
                ))}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog visible={duplicatesDialogVisible} onDismiss={() => setDuplicatesDialogVisible(false)}>
          <Dialog.Title>Duplicate Apps</Dialog.Title>
          <Dialog.Content>
            {duplicates.length === 0 ? (
              <Text>No duplicate apps found in this collection.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {duplicates.map((dup, index) => (
                  <View key={dup.packageName}>
                    <List.Item
                      title={dup.packageName}
                      description={`In: ${dup.listNames.join(', ')}`}
                      left={(props) => <List.Icon {...props} icon="content-duplicate" />}
                    />
                    {index < duplicates.length - 1 && <Divider />}
                  </View>
                ))}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDuplicatesDialogVisible(false)}>Close</Button>
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
