import { create } from 'zustand';
import type { AppList, Collection, ListApp } from '../lib/repository';

interface ListsState {
  // Data
  lists: AppList[];
  collections: Collection[];
  currentListApps: ListApp[];
  currentListId: number | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  
  // Selection
  selectedAppIds: Set<number>;
  isSelectionMode: boolean;
  
  // Actions
  setLists: (lists: AppList[]) => void;
  setCollections: (collections: Collection[]) => void;
  setCurrentListApps: (apps: ListApp[]) => void;
  setCurrentListId: (id: number | null) => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  
  toggleAppSelection: (appId: number) => void;
  selectAllApps: (appIds: number[]) => void;
  clearAppSelection: () => void;
  setSelectionMode: (mode: boolean) => void;
  
  // Computed
  getFilteredListApps: () => ListApp[];
}

export const useListsStore = create<ListsState>((set, get) => ({
  // Initial state
  lists: [],
  collections: [],
  currentListApps: [],
  currentListId: null,
  
  isLoading: false,
  error: null,
  searchQuery: '',
  
  selectedAppIds: new Set(),
  isSelectionMode: false,
  
  // Actions
  setLists: (lists) => set({ lists }),
  setCollections: (collections) => set({ collections }),
  setCurrentListApps: (currentListApps) => set({ currentListApps }),
  setCurrentListId: (currentListId) => set({ currentListId }),
  
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  toggleAppSelection: (appId) => set((state) => {
    const newSelected = new Set(state.selectedAppIds);
    if (newSelected.has(appId)) {
      newSelected.delete(appId);
    } else {
      newSelected.add(appId);
    }
    return {
      selectedAppIds: newSelected,
      isSelectionMode: newSelected.size > 0,
    };
  }),
  
  selectAllApps: (appIds) => set({
    selectedAppIds: new Set(appIds),
    isSelectionMode: appIds.length > 0,
  }),
  
  clearAppSelection: () => set({
    selectedAppIds: new Set(),
    isSelectionMode: false,
  }),
  
  setSelectionMode: (isSelectionMode) => set({
    isSelectionMode,
    selectedAppIds: isSelectionMode ? get().selectedAppIds : new Set(),
  }),
  
  getFilteredListApps: () => {
    const state = get();
    let filtered = [...state.currentListApps];
    
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.title.toLowerCase().includes(query) ||
        app.packageName.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  },
}));
