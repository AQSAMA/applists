import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import {
    Appbar,
    Button,
    Dialog,
    Divider,
    List,
    Portal,
    RadioButton,
    Snackbar,
    Text,
    useTheme,
} from 'react-native-paper';

import { clearIconCache } from '@/lib/repository';
import { useThemeStore } from '@/stores';

export default function SettingsScreen() {
  const theme = useTheme<MD3Theme>();
  const { themeMode, setThemeMode, getEffectiveColorScheme } = useThemeStore();
  const effectiveScheme = getEffectiveColorScheme();

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
      <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
        <Appbar.Content title="Settings" />
      </Appbar.Header>

      <ScrollView>
        <List.Section>
          <List.Subheader>Appearance</List.Subheader>
          <List.Item
            title="System Default"
            description="Follow system settings"
            left={(props) => <List.Icon {...props} icon="cellphone" />}
            right={() => (
              <RadioButton
                value="system"
                status={themeMode === 'system' ? 'checked' : 'unchecked'}
                onPress={() => setThemeMode('system')}
              />
            )}
            onPress={() => setThemeMode('system')}
          />
          <List.Item
            title="Light Mode"
            left={(props) => <List.Icon {...props} icon="white-balance-sunny" />}
            right={() => (
              <RadioButton
                value="light"
                status={themeMode === 'light' ? 'checked' : 'unchecked'}
                onPress={() => setThemeMode('light')}
              />
            )}
            onPress={() => setThemeMode('light')}
          />
          <List.Item
            title="Dark Mode"
            left={(props) => <List.Icon {...props} icon="moon-waning-crescent" />}
            right={() => (
              <RadioButton
                value="dark"
                status={themeMode === 'dark' ? 'checked' : 'unchecked'}
                onPress={() => setThemeMode('dark')}
              />
            )}
            onPress={() => setThemeMode('dark')}
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
