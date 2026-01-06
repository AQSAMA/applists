import { create } from 'zustand';
import type { AppInfo } from '../modules/installed-apps';

export type AppFilter = 'all' | 'user' | 'system';
export type SortField = 'name' | 'packageName' | 'installDate' | 'updateDate' | 'size';

interface AppsState {
  // Data
  apps: AppInfo[];
  isLoading: boolean;
  error: string | null;
  lastRefresh: number | null;
  
  // Filters & Sort
  filter: AppFilter;
  sortField: SortField;
  sortReverse: boolean;
  searchQuery: string;
  excludeListed: boolean;
  listedPackages: Set<string>;
  
  // Selection
  selectedPackages: Set<string>;
  isSelectionMode: boolean;
  
  // Actions
  setApps: (apps: AppInfo[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastRefresh: (time: number) => void;
  
  setFilter: (filter: AppFilter) => void;
  setSortField: (field: SortField) => void;
  toggleSortReverse: () => void;
  setSearchQuery: (query: string) => void;
  setExcludeListed: (exclude: boolean) => void;
  setListedPackages: (packages: Set<string>) => void;
  
  toggleSelection: (packageName: string) => void;
  selectAll: (packageNames: string[]) => void;
  clearSelection: () => void;
  setSelectionMode: (mode: boolean) => void;
  updateAppIcon: (packageName: string, icon: string) => void;
  
  // Computed
  getFilteredApps: () => AppInfo[];
}

export const useAppsStore = create<AppsState>((set, get) => ({
  // Initial state
  apps: [],
  isLoading: false,
  error: null,
  lastRefresh: null,
  
  filter: 'all',
  sortField: 'name',
  sortReverse: false,
  searchQuery: '',
  excludeListed: false,
  listedPackages: new Set(),
  
  selectedPackages: new Set(),
  isSelectionMode: false,
  
  // Actions
  setApps: (apps) => set({ apps }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setLastRefresh: (lastRefresh) => set({ lastRefresh }),
  
  setFilter: (filter) => set({ filter }),
  setSortField: (sortField) => set({ sortField }),
  toggleSortReverse: () => set((state) => ({ sortReverse: !state.sortReverse })),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setExcludeListed: (excludeListed) => set({ excludeListed }),
  setListedPackages: (listedPackages) => set({ listedPackages }),
  
  toggleSelection: (packageName) => set((state) => {
    const newSelected = new Set(state.selectedPackages);
    if (newSelected.has(packageName)) {
      newSelected.delete(packageName);
    } else {
      newSelected.add(packageName);
    }
    return { 
      selectedPackages: newSelected,
      isSelectionMode: newSelected.size > 0,
    };
  }),
  
  selectAll: (packageNames) => set({
    selectedPackages: new Set(packageNames),
    isSelectionMode: packageNames.length > 0,
  }),
  
  clearSelection: () => set({ 
    selectedPackages: new Set(),
    isSelectionMode: false,
  }),
  
  setSelectionMode: (isSelectionMode) => set({ 
    isSelectionMode,
    selectedPackages: isSelectionMode ? get().selectedPackages : new Set(),
  }),
  
  updateAppIcon: (packageName, icon) => set((state) => ({
    apps: state.apps.map((app) =>
      app.packageName === packageName ? { ...app, icon } : app
    ),
  })),
  
  getFilteredApps: () => {
    const state = get();
    let filtered = [...state.apps];
    
    // Apply filter
    if (state.filter === 'user') {
      filtered = filtered.filter(app => !app.isSystem);
    } else if (state.filter === 'system') {
      filtered = filtered.filter(app => app.isSystem);
    }
    
    // Apply exclusion
    if (state.excludeListed && state.listedPackages.size > 0) {
      filtered = filtered.filter(app => !state.listedPackages.has(app.packageName));
    }
    
    // Apply search
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.title.toLowerCase().includes(query) ||
        app.packageName.toLowerCase().includes(query)
      );
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (state.sortField) {
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'packageName':
          comparison = a.packageName.localeCompare(b.packageName);
          break;
        case 'installDate':
          comparison = a.installTime - b.installTime;
          break;
        case 'updateDate':
          comparison = a.lastUpdateTime - b.lastUpdateTime;
          break;
        case 'size':
          comparison = a.apkSize - b.apkSize;
          break;
      }
      return state.sortReverse ? -comparison : comparison;
    });
    
    return filtered;
  },
}));
