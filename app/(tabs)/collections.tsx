import * as DocumentPicker from "expo-document-picker";
import { readAsStringAsync } from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { MD3Theme } from "react-native-paper";
import {
  Appbar,
  Button,
  Dialog,
  FAB,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";

import { CollectionCard, EmptyState, SearchBar } from "@/components/ui";
import type { Collection } from "@/lib/repository";
import {
  createCollection,
  deleteCollection,
  getAllCollections,
  importCollectionData,
} from "@/lib/repository";
import { useListsStore } from "@/stores";

export default function CollectionsScreen() {
  const theme = useTheme<MD3Theme>();
  const router = useRouter();

  const { collections, setCollections, isLoading, setLoading } =
    useListsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [dialogVisible, setDialogVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [collectionToDelete, setCollectionToDelete] =
    useState<Collection | null>(null);

  const loadCollections = useCallback(async () => {
    try {
      setLoading(true);
      const allCollections = await getAllCollections();
      setCollections(allCollections);
    } catch (error) {
      console.error("Failed to load collections:", error);
      setSnackbarMessage("Failed to load collections");
    } finally {
      setLoading(false);
    }
  }, [setCollections, setLoading]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createCollection(
        newName.trim(),
        newDescription.trim() || undefined,
      );
      setDialogVisible(false);
      setNewName("");
      setNewDescription("");
      await loadCollections();
      setSnackbarMessage("Collection created");
    } catch (error) {
      console.error("Failed to create collection:", error);
      setSnackbarMessage("Failed to create collection");
    }
  };

  const handleDelete = async () => {
    if (!collectionToDelete) return;
    try {
      await deleteCollection(collectionToDelete.id);
      setDeleteDialogVisible(false);
      setCollectionToDelete(null);
      await loadCollections();
      setSnackbarMessage("Collection deleted");
    } catch (error) {
      console.error("Failed to delete collection:", error);
      setSnackbarMessage("Failed to delete collection");
    }
  };

  const handlePress = (collection: Collection) => {
    router.push(`/collection/${collection.id}`);
  };

  const handleLongPress = (collection: Collection) => {
    setCollectionToDelete(collection);
    setDeleteDialogVisible(true);
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const fileUri = result.assets[0].uri;
      const content = await readAsStringAsync(fileUri);
      const data = JSON.parse(content);

      await importCollectionData(data);
      await loadCollections();
      setSnackbarMessage("Collection imported successfully");
    } catch (error) {
      console.error("Failed to import collection:", error);
      setSnackbarMessage("Failed to import collection. Check file format.");
    }
  };

  const filteredCollections = searchQuery.trim()
    ? collections.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : collections;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Collections" />
        <Appbar.Action icon="import" onPress={handleImport} />
      </Appbar.Header>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search collections..."
      />

      {filteredCollections.length === 0 ? (
        <EmptyState
          icon="folder-multiple"
          title={searchQuery ? "No collections found" : "No collections yet"}
          description={
            searchQuery
              ? "Try a different search"
              : "Create a collection to group your lists"
          }
        />
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {filteredCollections.map((collection) => (
            <CollectionCard
              key={collection.id}
              collection={collection}
              onPress={() => handlePress(collection)}
              onLongPress={() => handleLongPress(collection)}
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
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Dialog.Title>New Collection</Dialog.Title>
          <Dialog.ScrollArea>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
              <TextInput
                label="Name"
                value={newName}
                onChangeText={setNewName}
                mode="outlined"
                style={styles.input}
                autoFocus
              />
              <TextInput
                label="Description (optional)"
                value={newDescription}
                onChangeText={setNewDescription}
                mode="outlined"
                style={styles.input}
              />
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreate} disabled={!newName.trim()}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Collection</Dialog.Title>
          <Dialog.Content>
            <Text>
              Are you sure you want to delete &ldquo;{collectionToDelete?.name}
              &rdquo;?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleDelete} textColor={theme.colors.error}>
              Delete
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
  listContainer: {
    paddingVertical: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
  input: {
    marginBottom: 12,
  },
});
