# App List Manager - Implementation Plan

## Overview
Build an Android "App List Manager" using Expo React Native with Material Design 3. Requires development build for native Android PackageManager access.

---

## Todo Items

### 1. Install Dependencies
- [ ] Add react-native-paper (Material Design 3)
- [ ] Add expo-sqlite for data persistence
- [ ] Add @shopify/flash-list for performant lists
- [ ] Add expo-file-system and expo-sharing for export
- [ ] Add zustand for state management
- [ ] Run npx expo prebuild for development build

### 2. Create Native Module for Installed Apps
- [ ] Create Expo module structure with expo-modules-core
- [ ] Implement Android PackageManager integration
- [ ] Return app metadata (name, package, version, sizes, SDKs, timestamps)
- [ ] Return app icons as base64

### 3. Set Up Data Layer
- [ ] Design SQLite schema (lists, collections, apps, tags)
- [ ] Create zustand stores (apps, lists, collections, UI state)
- [ ] Build repository functions for CRUD operations

### 4. Build Material 3 UI Components
- [ ] AppListItem - App row with icon, name, metadata, status badges
- [ ] SearchBar - Global and in-list search
- [ ] FilterChips - System/User/All toggle
- [ ] SortMenu - Name, Package, Date, Size with reverse toggle
- [ ] EmptyState - Illustrations for empty lists/searches
- [ ] StatusBadge - Installed/Missing/System indicators
- [ ] SelectableList - Multi-select wrapper

### 5. Implement Main Screens
- [ ] Home - Installed apps with filters, sort, search
- [ ] Lists - All user lists with counts
- [ ] Collections - Grouped lists view
- [ ] List Detail - Apps in a list with management
- [ ] Settings - Theme, cache, about

### 6. Add List Management Features
- [ ] Batch selection mode
- [ ] Merge lists utility
- [ ] Duplicate detection warnings
- [ ] Tags/labels system
- [ ] Exclusion toggle (hide listed apps from main view)

### 7. Implement Import/Export
- [ ] Single list JSON export (matching provided schema)
- [ ] Collection JSON export (nested format)
- [ ] Import with validation
- [ ] Missing app detection for imported lists

---

## Review
_To be completed after implementation_
