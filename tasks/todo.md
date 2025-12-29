# App List Manager - Implementation Plan

## Overview
Build an Android "App List Manager" using Expo React Native with Material Design 3. Requires development build for native Android PackageManager access.

---

## Todo Items

### 1. Install Dependencies
- [x] Add react-native-paper (Material Design 3)
- [x] Add expo-sqlite for data persistence
- [x] Add @shopify/flash-list for performant lists
- [x] Add expo-file-system and expo-sharing for export
- [x] Add zustand for state management
- [x] Run npx expo prebuild for development build

### 2. Create Native Module for Installed Apps
- [x] Create Expo module structure with expo-modules-core
- [x] Implement Android PackageManager integration
- [x] Return app metadata (name, package, version, sizes, SDKs, timestamps)
- [x] Return app icons as base64

### 3. Set Up Data Layer
- [x] Design SQLite schema (lists, collections, apps, tags)
- [x] Create zustand stores (apps, lists, collections, UI state)
- [x] Build repository functions for CRUD operations

### 4. Build Material 3 UI Components
- [x] AppListItem - App row with icon, name, metadata, status badges
- [x] SearchBar - Global and in-list search
- [x] FilterChips - System/User/All toggle
- [x] SortMenu - Name, Package, Date, Size with reverse toggle
- [x] EmptyState - Illustrations for empty lists/searches
- [x] StatusBadge - Installed/Missing/System indicators
- [x] SelectableList - Multi-select wrapper

### 5. Implement Main Screens
- [x] Home - Installed apps with filters, sort, search
- [x] Lists - All user lists with counts
- [x] Collections - Grouped lists view
- [x] List Detail - Apps in a list with management
- [x] Settings - Theme, cache, about

### 6. Add List Management Features
- [x] Batch selection mode
- [x] Exclusion toggle (hide listed apps from main view)
- [x] Merge lists utility UI (Dialog for selecting target list)
- [x] Duplicate detection UI (View for apps appearing in multiple lists within a collection)

### 7. Implement Import/Export
- [x] Single list JSON export (using expo-sharing)
- [x] Collection JSON export (nested format)
- [x] Import with validation (using expo-document-picker)

---

## Review

### Completed in this session (December 28, 2025)

#### Export Functionality
- Added export to List Detail screen ([app/list/[id].tsx](app/list/[id].tsx))
  - Uses `exportListData()` from repository
  - Writes JSON to cache directory using expo-file-system/legacy API
  - Opens share dialog via expo-sharing

- Added export to Collection Detail screen ([app/collection/[id].tsx](app/collection/[id].tsx))
  - Uses `exportCollectionData()` from repository
  - Same file handling pattern as list export

#### Import Functionality
- Added import button to Lists tab ([app/(tabs)/lists.tsx](app/(tabs)/lists.tsx))
  - Uses expo-document-picker for JSON file selection
  - Reads file content using expo-file-system/legacy API
  - Calls `importListData()` from repository

- Added import button to Collections tab ([app/(tabs)/collections.tsx](app/(tabs)/collections.tsx))
  - Same pattern as lists import
  - Calls `importCollectionData()` from repository

#### Duplicate Detection
- Added "Check Duplicates" menu item in Collection Detail
- Shows dialog with list of apps appearing in multiple lists
- Uses `findDuplicatesInCollection()` from repository
- Displays package name and which lists contain each duplicate

#### Merge Lists UI
- Added merge button to Lists tab header
- Dialog allows selecting multiple lists via checkboxes
- Radio buttons to select target list (where apps will be merged)
- Uses `mergeLists()` from repository
- Source lists are deleted after merge

### Technical Notes
- Used expo-file-system/legacy API (`cacheDirectory`, `writeAsStringAsync`, `readAsStringAsync`) due to breaking changes in the new API
- All dialogs follow Material Design 3 patterns with react-native-paper
- Proper error handling with user-friendly snackbar messages

### Remaining Items (future work)
- Tags/labels system UI for apps in list detail
- Missing app detection visual indicator in list imports
- [ ] Create UI for selecting lists to merge with mergeLists function

---

## Review
### Current Status
- Core infrastructure and native modules are complete.
- Basic CRUD for lists and collections is functional.
- UI components follow Material 3 guidelines.
- Repository already has export/import functions implemented.