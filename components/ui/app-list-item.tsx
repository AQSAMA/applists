import { memo, useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { MD3Theme } from 'react-native-paper';
import { Checkbox, Chip, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { StatusColors } from '../../constants/paper-theme';
import type { AppInfo } from '../../modules/installed-apps';
import { getAppIcon } from '../../modules/installed-apps';
import { useAppsStore } from '../../stores/apps-store';

interface AppListItemProps {
  app: AppInfo;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  showStatus?: boolean;
  status?: 'installed' | 'missing' | 'system';
  inLists?: string[];
  onPress?: () => void;
  onLongPress?: () => void;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

export const AppListItem = memo(function AppListItem({
  app,
  isSelected = false,
  isSelectionMode = false,
  showStatus = false,
  status,
  inLists,
  onPress,
  onLongPress,
}: AppListItemProps) {
  const theme = useTheme<MD3Theme>();
  const updateAppIcon = useAppsStore((state) => state.updateAppIcon);
  const [icon, setIcon] = useState<string | null>(app.icon);
  
  // Lazy load icon if not present
  useEffect(() => {
    if (!app.icon && app.packageName) {
      let mounted = true;
      getAppIcon(app.packageName).then((loadedIcon) => {
        if (mounted && loadedIcon) {
          setIcon(loadedIcon);
          updateAppIcon(app.packageName, loadedIcon);
        }
      });
      return () => { mounted = false; };
    }
  }, [app.icon, app.packageName, updateAppIcon]);
  
  const displayStatus = status || (app.isSystem ? 'system' : 'installed');
  
  return (
    <TouchableRipple
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.container,
        isSelected && { backgroundColor: theme.colors.primaryContainer },
      ]}
    >
      <View style={styles.content}>
        {isSelectionMode && (
          <Checkbox
            status={isSelected ? 'checked' : 'unchecked'}
            onPress={onPress}
          />
        )}
        
        <View style={styles.iconContainer}>
          {icon ? (
            <Image
              source={{ uri: `data:image/png;base64,${icon}` }}
              style={styles.icon}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.iconPlaceholder, { backgroundColor: theme.colors.surfaceVariant }]}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {app.title.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text variant="titleMedium" numberOfLines={1} style={styles.title}>
              {app.title}
            </Text>
            {showStatus && (
              <View style={[styles.statusDot, { backgroundColor: StatusColors[displayStatus] }]} />
            )}
          </View>
          
          <Text
            variant="bodySmall"
            numberOfLines={1}
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {app.packageName}
          </Text>
          
          <View style={styles.metaRow}>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              v{app.version} • {formatSize(app.apkSize)}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {formatDate(app.lastUpdateTime)}
            </Text>
          </View>
          
          {inLists && inLists.length > 0 && (
            <View style={styles.listsRow}>
              {inLists.slice(0, 2).map((listName, index) => (
                <Chip
                  key={index}
                  compact
                  mode="flat"
                  style={styles.listChip}
                  textStyle={styles.listChipText}
                >
                  {listName}
                </Chip>
              ))}
              {inLists.length > 2 && (
                <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                  +{inLists.length - 2}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </TouchableRipple>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 16,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  listsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  listChip: {
    height: 20,
  },
  listChipText: {
    fontSize: 10,
    lineHeight: 12,
    marginVertical: 0,
  },
});
