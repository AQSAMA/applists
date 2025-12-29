import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import {
  Appbar,
  Button,
  Checkbox,
  Dialog,
  FAB,
  List,
  Portal,
  RadioButton,
  Snackbar,
  Text,
  TextInput,
  useTheme
} from 'react-native-paper';

import { EmptyState, ListCard, SearchBar } from '@/components/ui';
import type { AppList } from '@/lib/repository';
import { createList, deleteList, getAllLists, importListData, mergeLists } from '@/lib/repository';
import { useListsStore } from '@/stores';

export default function ListsScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();

  const { lists, setLists, isLoading, setLoading, searchQuery, setSearchQuery } = useListsStore();

  const [dialogVisible, setDialogVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [listToDelete, setListToDelete] = useState<AppList | null>(null);
  const [mergeDialogVisible, setMergeDialogVisible] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<Set<number>>(new Set());
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);

  const loadLists = useCallback(async () => {
    try {
      setLoading(true);
      const allLists = await getAllLists();
      setLists(allLists);
    } catch (error) {
      console.error('Failed to load lists:', error);
      setSnackbarMessage('Failed to load lists');
    } finally {
      setLoading(false);
    }
  }, [setLists, setLoading]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      await createList(newListName.trim(), newListDescription.trim() || undefined);
      setDialogVisible(false);
      setNewListName('');
      setNewListDescription('');
      await loadLists();
      setSnackbarMessage('List created');
    } catch (error) {
      console.error('Failed to create list:', error);
      setSnackbarMessage('Failed to create list');
    }
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;
    try {
      await deleteList(listToDelete.id);
      setDeleteDialogVisible(false);
      setListToDelete(null);
      await loadLists();
      setSnackbarMessage('List deleted');
    } catch (error) {
      console.error('Failed to delete list:', error);
      setSnackbarMessage('Failed to delete list');
    }
  };

  const handleListPress = (list: AppList) => {
    router.push(`/list/${list.id}`);
  };

  const handleListLongPress = (list: AppList) => {
    setListToDelete(list);
    setDeleteDialogVisible(true);
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const fileUri = result.assets[0].uri;
      const content = await readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      await importListData(data);
      await loadLists();
      setSnackbarMessage('List imported successfully');
    } catch (error) {
      console.error('Failed to import list:', error);
      setSnackbarMessage('Failed to import list. Check file format.');
    }
  };

  const handleOpenMerge = () => {
    setSelectedForMerge(new Set());
    setMergeTargetId(null);
    setMergeDialogVisible(true);
  };

  const toggleMergeSelection = (id: number) => {
    setSelectedForMerge((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        if (mergeTargetId === id) setMergeTargetId(null);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleMerge = async () => {
    if (!mergeTargetId || selectedForMerge.size < 2) return;
    try {
      const sourceIds = Array.from(selectedForMerge).filter((id) => id !== mergeTargetId);
      await mergeLists(sourceIds, mergeTargetId);
      setMergeDialogVisible(false);
      await loadLists();
      setSnackbarMessage(`Merged ${sourceIds.length} list(s) into target`);
    } catch (error) {
      console.error('Failed to merge lists:', error);
      setSnackbarMessage('Failed to merge lists');
    }
  };

  const filteredLists = searchQuery.trim()
    ? lists.filter(
      (l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : lists;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="My Lists" />
        <Appbar.Action icon="merge" onPress={handleOpenMerge} />
        <Appbar.Action icon="import" onPress={handleImport} />
      </Appbar.Header>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search lists..." />

      {filteredLists.length === 0 ? (
        <EmptyState
          icon="format-list-bulleted"
          title={searchQuery ? 'No lists found' : 'No lists yet'}
          description={searchQuery ? 'Try a different search' : 'Create a list to organize your apps'}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {filteredLists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              onPress={() => handleListPress(list)}
              onLongPress={() => handleListLongPress(list)}
            />
          ))}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        onPress={() => setDialogVisible(true)}
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>New List</Dialog.Title>
          <Dialog.ScrollArea>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <TextInput
                label="Name"
                value={newListName}
                onChangeText={setNewListName}
                mode="outlined"
                style={styles.input}
                autoFocus
              />
              <TextInput
                label="Description (optional)"
                value={newListDescription}
                onChangeText={setNewListDescription}
                mode="outlined"
                style={styles.input}
              />
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateList} disabled={!newListName.trim()}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete List</Dialog.Title>
          <Dialog.Content>
            <Button>Are you sure you want to delete "{listToDelete?.name}"?</Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleDeleteList} textColor={theme.colors.error}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={mergeDialogVisible} onDismiss={() => setMergeDialogVisible(false)}>
          <Dialog.Title>Merge Lists</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
              Select lists to merge, then choose the target list:
            </Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {lists.map((list) => (
                <List.Item
                  key={list.id}
                  title={list.name}
                  description={`${list.appCount || 0} apps`}
                  left={() => (
                    <Checkbox
                      status={selectedForMerge.has(list.id) ? 'checked' : 'unchecked'}
                      onPress={() => toggleMergeSelection(list.id)}
                    />
                  )}
                  right={() =>
                    selectedForMerge.has(list.id) ? (
                      <RadioButton
                        value={list.id.toString()}
                        status={mergeTargetId === list.id ? 'checked' : 'unchecked'}
                        onPress={() => setMergeTargetId(list.id)}
                      />
                    ) : null
                  }
                  onPress={() => toggleMergeSelection(list.id)}
                />
              ))}
            </ScrollView>
            {selectedForMerge.size >= 2 && !mergeTargetId && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 8 }}>
                Select a target list (radio button on the right)
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setMergeDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleMerge}
              disabled={selectedForMerge.size < 2 || !mergeTargetId}
            >
              Merge
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
  listContainer: {
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  input: {
    marginBottom: 12,
  },
});
