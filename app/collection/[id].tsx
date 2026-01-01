import { cacheDirectory, writeAsStringAsync } from "expo-file-system/legacy";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import type { MD3Theme } from "react-native-paper";
import {
  Appbar,
  Button,
  Dialog,
  Divider,
  FAB,
  IconButton,
  List,
  Portal,
  Snackbar,
  Text,
  TextInput,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

import { EmptyState, ListCard, SearchBar } from "@/components/ui";
import type { AppList, Collection } from "@/lib/repository";
import {
  addListToCollection,
  exportCollectionData,
  findDuplicatesInCollection,
  getAllLists,
  getCollection,
  getCollectionLists,
  removeListFromCollection,
  updateCollection,
} from "@/lib/repository";

export default function CollectionDetailScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const collectionId = parseInt(id || "0", 10);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [lists, setLists] = useState<AppList[]>([]);
  const [allLists, setAllLists] = useState<AppList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const [duplicatesDialogVisible, setDuplicatesDialogVisible] = useState(false);
  const [duplicates, setDuplicates] = useState<
    { packageName: string; listNames: string[] }[]
  >([]);

  // Remove list dialog state
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [listToRemove, setListToRemove] = useState<AppList | null>(null);

  // Rename dialog
  const [renameDialogVisible, setRenameDialogVisible] = useState(false);
  const [newName, setNewName] = useState("");

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
      console.error("Failed to load collection:", error);
      setSnackbarMessage("Failed to load collection");
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleListPress = (list: AppList) => {
    // Only navigate if the list still exists (id > 0)
    if (list.id > 0) {
      router.push(`/list/${list.id}`);
    }
  };

  const handleListLongPress = (list: AppList) => {
    setListToRemove(list);
    setRemoveDialogVisible(true);
  };

  const handleRemoveList = async () => {
    if (!listToRemove) return;
    try {
      await removeListFromCollection(collectionId, listToRemove.id);
      setRemoveDialogVisible(false);
      setListToRemove(null);
      await loadData();
      setSnackbarMessage("List removed from collection");
    } catch (error) {
      console.error("Failed to remove list:", error);
      setSnackbarMessage("Failed to remove list");
    }
  };

  const handleAddList = async (listId: number) => {
    try {
      await addListToCollection(collectionId, listId);
      setAddMenuVisible(false);
      await loadData();
      setSnackbarMessage("List added to collection");
    } catch (error) {
      console.error("Failed to add list:", error);
      setSnackbarMessage("Failed to add list");
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportCollectionData(collectionId);
      const fileName = `${collection?.name?.replace(/[^a-z0-9]/gi, "_") || "collection"}.json`;
      const filePath = `${cacheDirectory}${fileName}`;
      await writeAsStringAsync(filePath, JSON.stringify(data, null, 2));
      await Sharing.shareAsync(filePath, {
        mimeType: "application/json",
        dialogTitle: `Export ${collection?.name || "Collection"}`,
      });
    } catch (error) {
      console.error("Failed to export collection:", error);
      setSnackbarMessage("Failed to export collection");
    }
  };

  const handleOpenRenameDialog = () => {
    setNewName(collection?.name || "");
    setRenameDialogVisible(true);
    setMenuVisible(false);
  };

  const handleRename = async () => {
    if (!newName.trim()) {
      setSnackbarMessage("Name cannot be empty");
      return;
    }
    try {
      await updateCollection(
        collectionId,
        newName.trim(),
        collection?.description ?? undefined,
      );
      setCollection((prev) =>
        prev ? { ...prev, name: newName.trim() } : null,
      );
      setRenameDialogVisible(false);
      setSnackbarMessage("Collection renamed");
    } catch (error) {
      console.error("Failed to rename collection:", error);
      setSnackbarMessage("Failed to rename collection");
    }
  };

  const handleCheckDuplicates = async () => {
    try {
      const duplicateMap = await findDuplicatesInCollection(collectionId);
      const listNameMap = new Map(lists.map((l) => [l.id, l.name]));

      const duplicateList = Array.from(duplicateMap.entries()).map(
        ([packageName, listIds]) => ({
          packageName,
          listNames: listIds.map((id) => listNameMap.get(id) || `List ${id}`),
        }),
      );

      setDuplicates(duplicateList);
      setDuplicatesDialogVisible(true);
    } catch (error) {
      console.error("Failed to check duplicates:", error);
      setSnackbarMessage("Failed to check duplicates");
    }
  };

  const filteredLists = searchQuery.trim()
    ? lists.filter(
        (l) =>
          l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : lists;

  const availableLists = allLists.filter(
    (l) => !lists.some((cl) => cl.id === l.id),
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: collection?.name || "Collection",
          headerRight: () => (
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          ),
        }}
      />

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search lists..."
      />

      <View style={styles.statsRow}>
        <Text
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
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
              onLongPress={() => handleListLongPress(list)}
            />
          ))}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        onPress={() => setAddMenuVisible(true)}
        style={[styles.fab, { backgroundColor: theme.colors.primaryContainer }]}
        color={theme.colors.onPrimaryContainer}
      />

      <Portal>
        <Modal
          visible={addMenuVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAddMenuVisible(false)}
        >
          <Pressable
            style={styles.overlay}
            onPress={() => setAddMenuVisible(false)}
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
                Add List
              </Text>
              {availableLists.length === 0 ? (
                <Text style={styles.emptyText}>No available lists</Text>
              ) : (
                <ScrollView style={styles.sheetScroll}>
                  {availableLists.map((list) => (
                    <TouchableRipple
                      key={list.id}
                      onPress={() => handleAddList(list.id)}
                      style={styles.sheetItem}
                    >
                      <View style={styles.sheetItemContent}>
                        <IconButton icon="format-list-bulleted" size={24} />
                        <Text variant="bodyLarge">{list.name}</Text>
                      </View>
                    </TouchableRipple>
                  ))}
                </ScrollView>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </Portal>

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
              <TouchableRipple
                onPress={() => {
                  setMenuVisible(false);
                  handleCheckDuplicates();
                }}
                style={styles.sheetItem}
              >
                <View style={styles.sheetItemContent}>
                  <IconButton icon="content-duplicate" size={24} />
                  <Text variant="bodyLarge">Check Duplicates</Text>
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
          <Dialog.Title>Rename Collection</Dialog.Title>
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

      <Portal>
        <Dialog
          visible={removeDialogVisible}
          onDismiss={() => setRemoveDialogVisible(false)}
        >
          <Dialog.Title>Remove List</Dialog.Title>
          <Dialog.Content>
            <Text>
              Remove &ldquo;{listToRemove?.name}&rdquo; from this collection?
            </Text>
            <Text
              variant="bodySmall"
              style={{ marginTop: 8, color: theme.colors.onSurfaceVariant }}
            >
              The list itself will not be deleted.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRemoveDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleRemoveList} textColor={theme.colors.error}>
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={duplicatesDialogVisible}
          onDismiss={() => setDuplicatesDialogVisible(false)}
        >
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
                      description={`In: ${dup.listNames.join(", ")}`}
                      left={(props) => (
                        <List.Icon {...props} icon="content-duplicate" />
                      )}
                    />
                    {index < duplicates.length - 1 && <Divider />}
                  </View>
                ))}
              </ScrollView>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDuplicatesDialogVisible(false)}>
              Close
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
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listContainer: {
    paddingVertical: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
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
  sheetScroll: {
    maxHeight: 300,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    opacity: 0.6,
  },
});
