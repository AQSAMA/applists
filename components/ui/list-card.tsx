import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';
import type { AppList, Collection } from '../../lib/repository';

interface ListCardProps {
  list: AppList;
  onPress?: () => void;
  onLongPress?: () => void;
}

interface CollectionCardProps {
  collection: Collection;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function ListCard({ list, onPress, onLongPress }: ListCardProps) {
  const theme = useTheme<MD3Theme>();

  return (
    <TouchableRipple onPress={onPress} onLongPress={onLongPress} style={styles.card}>
      <View style={[styles.cardContent, { backgroundColor: theme.colors.elevation.level1 }]}>
        <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer }}>
            {list.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text variant="titleMedium" numberOfLines={1}>
            {list.name}
          </Text>
          {list.description && (
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {list.description}
            </Text>
          )}
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            {list.appCount || 0} apps
          </Text>
        </View>
      </View>
    </TouchableRipple>
  );
}

export function CollectionCard({ collection, onPress, onLongPress }: CollectionCardProps) {
  const theme = useTheme<MD3Theme>();

  return (
    <TouchableRipple onPress={onPress} onLongPress={onLongPress} style={styles.card}>
      <View style={[styles.cardContent, { backgroundColor: theme.colors.elevation.level1 }]}>
        <View style={[styles.iconBox, { backgroundColor: theme.colors.tertiaryContainer }]}>
          <Text variant="titleLarge" style={{ color: theme.colors.onTertiaryContainer }}>
            {collection.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text variant="titleMedium" numberOfLines={1}>
            {collection.name}
          </Text>
          {collection.description && (
            <Text
              variant="bodySmall"
              numberOfLines={1}
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {collection.description}
            </Text>
          )}
          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            {collection.listCount || 0} lists
          </Text>
        </View>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  info: {
    flex: 1,
    gap: 2,
  },
});
