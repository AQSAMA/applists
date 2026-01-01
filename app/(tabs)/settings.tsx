import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import {
    Button,
    Dialog,
    Divider,
    List,
    Portal,
    Snackbar,
    Switch,
    Text,
    useTheme,
} from 'react-native-paper';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearIconCache } from '@/lib/repository';
import { useThemeStore } from '@/stores/theme-store';

export default function SettingsScreen() {
  const theme = useTheme<MD3Theme>();
  const colorScheme = useColorScheme();
  const setThemeMode = useThemeStore((state) => state.setThemeMode);

  const [clearCacheDialogVisible, setClearCacheDialogVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleClearCache = async () => {
    try {
      await clearIconCache();
      setClearCacheDialogVisible(false);
      setSnackbarMessage('Icon cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setSnackbarMessage('Failed to clear cache');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="Dark Mode"
            description={colorScheme === 'dark' ? 'On' : 'Off'}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={colorScheme === 'dark'}
                onValueChange={(value) => setThemeMode(value ? 'dark' : 'light')}
              />
            )}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>Storage</List.Subheader>
          <List.Item
            title="Clear Icon Cache"
            description="Free up space by clearing cached app icons"
            left={(props) => <List.Icon {...props} icon="cached" />}
            onPress={() => setClearCacheDialogVisible(true)}
          />
        </List.Section>

        <Divider />

        <List.Section>
          <List.Subheader>About</List.Subheader>
          <List.Item
            title="App List Manager"
            description="Version 1.0.0"
            left={(props) => <List.Icon {...props} icon="information" />}
          />
          <List.Item
            title="Built with"
            description="Expo, React Native, Material Design 3"
            left={(props) => <List.Icon {...props} icon="heart" />}
          />
        </List.Section>
      </ScrollView>

      <Portal>
        <Dialog visible={clearCacheDialogVisible} onDismiss={() => setClearCacheDialogVisible(false)}>
          <Dialog.Title>Clear Icon Cache</Dialog.Title>
          <Dialog.Content>
            <Text>This will clear all cached app icons. They will be reloaded when needed.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setClearCacheDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleClearCache}>Clear</Button>
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
});
