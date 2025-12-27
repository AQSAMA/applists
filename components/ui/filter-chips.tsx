import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import type { AppFilter } from '../../stores/apps-store';

interface FilterChipsProps {
  currentFilter: AppFilter;
  onFilterChange: (filter: AppFilter) => void;
}

const filters: { label: string; value: AppFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'User Apps', value: 'user' },
  { label: 'System Apps', value: 'system' },
];

export function FilterChips({ currentFilter, onFilterChange }: FilterChipsProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <Chip
            key={filter.value}
            selected={currentFilter === filter.value}
            onPress={() => onFilterChange(filter.value)}
            style={styles.chip}
            mode="flat"
            showSelectedCheck={false}
          >
            {filter.label}
          </Chip>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    marginRight: 0,
  },
});
