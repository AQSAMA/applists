import { addAppsToList, getAllLists, type AppList } from '@/lib/repository';
import { useAppsStore } from '@/stores/apps-store';
import { useListsStore } from '@/stores/lists-store';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Divider, List, RadioButton, Text, useTheme } from 'react-native-paper';

export default function AddToListScreen() {
  const theme = useTheme();
  const { selectedPackages, apps, clearSelection } = useAppsStore();
  const { setLists } = useListsStore();
  
  const [lists, setLocalLists] = useState<AppList[]>([]);
  const [selectedListId, setSelectedListId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      const allLists = await getAllLists();
      setLocalLists(allLists);
    } catch (error) {
      console.error('Failed to load lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToList = async () => {
    if (!selectedListId || selectedPackages.size === 0) return;
    
    setIsSaving(true);
    try {
      // Get full app info for selected packages
      const selectedApps = apps.filter(app => selectedPackages.has(app.packageName));
      
      await addAppsToList(selectedListId, selectedApps);
      
      // Refresh lists store
      const updatedLists = await getAllLists();
      setLists(updatedLists);
      
      // Clear selection and go back
      clearSelection();
      router.back();
    } catch (error) {
      console.error('Failed to add apps to list:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderListItem = ({ item }: { item: AppList }) => (
    <List.Item
      title={item.name}
      description={`${item.appCount || 0} apps`}
      left={() => (
        <RadioButton
          value={String(item.id)}
          status={selectedListId === item.id ? 'checked' : 'unchecked'}
          onPress={() => setSelectedListId(item.id)}
        />
      )}
      onPress={() => setSelectedListId(item.id)}
      style={styles.listItem}
    />
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Add to List" subtitle={`${selectedPackages.size} apps selected`} />
      </Appbar.Header>

      {lists.length === 0 ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            No lists available. Create a list first.
          </Text>
          <Button 
            mode="contained" 
            onPress={() => router.back()} 
            style={styles.button}
          >
            Go Back
          </Button>
        </View>
      ) : (
        <>
          <FlatList
            data={lists}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderListItem}
            ItemSeparatorComponent={Divider}
            contentContainerStyle={styles.listContent}
          />
          
          <View style={[styles.footer, { backgroundColor: theme.colors.surface }]}>
            <Button
              mode="contained"
              onPress={handleAddToList}
              disabled={!selectedListId || isSaving}
              loading={isSaving}
              style={styles.addButton}
            >
              Add to List
            </Button>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listItem: {
    paddingLeft: 8,
  },
  listContent: {
    paddingBottom: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    elevation: 8,
  },
  addButton: {
    marginHorizontal: 16,
  },
  button: {
    marginTop: 16,
  },
});
