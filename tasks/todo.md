# App List Manager - Implementation Plan

## Overview
Build an Android "App List Manager" using Expo React Native with Material Design 3. Requires development build for native Android PackageManager access.

---

## UI Minimalist Adjustments (Current Task)

### Problem
1. Remove the top header/banner section ("Apps" / "Installed Apps" title area)
2. Make the sort menu appear as a solid bottom sheet instead of floating dropdown

### Plan
- [x] **1. Remove Appbar.Header from Apps screen** - Remove the header, keep filter/sort icons inline
- [x] **2. Convert SortMenu to bottom sheet** - Use Modal positioned at bottom of screen

### Changes Made
1. **`app/(tabs)/index.tsx`** - Removed Appbar.Header, moved search bar and filter/sort icons into a single row
2. **`components/ui/sort-menu.tsx`** - Converted from floating Portal Menu to a bottom sheet Modal

---

## Bug Fixes (Previous Task - Pop-up Menu & Collection Behavior)

### Problem 1: Pop-up menus only work once
Pop-up menus (like the sorting menu) only function once; clicking them a second time disables them.

### Problem 2: Sort menu appears on wrong side
The sorting menu appears on the left instead of right side of the screen.

### Problem 3: Long-press removes lists from collections
Long-pressing a list in a collection removes it - this should not happen.

### Problem 4: Deleting a list removes it from collections
When a list is deleted from the Lists menu, it's also removed from collections due to CASCADE. User wants lists to persist in collections independently.

### Fix Plan

- [x] **1. Fix SortMenu component** - Wrap Menu in Portal (like all other menus in the app)
- [x] **2. Fix dialog text** - Delete confirmation dialogs use `<Button>` instead of `<Text>`
- [x] **3. Fix SortMenu positioning** - Menu should appear on right side, anchored to button
- [x] **4. Remove long-press delete from collection detail** - Remove onLongPress handler from ListCard in collection/[id].tsx
- [x] **5. Change database CASCADE behavior** - Store list data directly in collection_lists table so collections persist independently
- [x] **6. Test and verify**

### Bug Fixes (Session 3)

#### Problems
1. Long-press on list in collection should show option to remove (with confirmation)
2. Dark/light mode toggle doesn't work - theme doesn't update reactively
3. Any other necessary fixes

#### Fix Plan
- [x] **1. Add long-press removal with confirmation dialog** - In collection/[id].tsx, add dialog to confirm removing list from collection
- [x] **2. Fix theme reactivity** - The useColorScheme hook doesn't trigger re-renders because getEffectiveColorScheme is not reactive. Need to make the theme store properly reactive.
- [x] **3. Review and fix any other issues**

### Changes Made (Bug Fix Session 3)

1. **`stores/theme-store.ts`** - Fixed theme reactivity:
   - Changed from using a `getEffectiveColorScheme()` function to storing `effectiveColorScheme` as reactive state
   - Added `initializeTheme()` function that sets up a listener for system theme changes
   - Added `onRehydrateStorage` to compute effective color scheme after state rehydration
   - Theme changes now properly trigger re-renders

2. **`hooks/use-color-scheme.ts`** - Updated to use the reactive `effectiveColorScheme` state instead of calling a function, and calls `initializeTheme()` on mount

3. **`app/collection/[id].tsx`** - Added long-press removal with confirmation:
   - Added `removeDialogVisible` and `listToRemove` state
   - Added `handleListLongPress` to show confirmation dialog
   - Added `handleRemoveList` to perform the removal
   - Added confirmation dialog with explanation that the list itself won't be deleted
   - Re-added `onLongPress` handler to ListCard components
   - Re-added `removeListFromCollection` import

### Changes Made (Bug Fix Session 1)

1. **`components/ui/sort-menu.tsx`** - Wrapped `Menu` component in `Portal` to fix the one-time click bug. The `IconButton` is now a sibling to `Portal` instead of being the anchor child of Menu.

2. **`app/(tabs)/lists.tsx`** - Changed `<Button>` to `<Text>` in the delete confirmation dialog content.

3. **`app/(tabs)/collections.tsx`** - Added missing `Text` import from react-native-paper and changed `<Button>` to `<Text>` in the delete confirmation dialog content.

### Changes Made (Bug Fix Session 2)

1. **`components/ui/sort-menu.tsx`** - Fixed positioning by using `measureInWindow` on a ref to get the button's actual position, then anchoring the Portal-wrapped Menu to that position. Menu now appears on the right side near the button.

2. **`app/collection/[id].tsx`** - Removed `onLongPress` handler from `ListCard` component so lists are no longer accidentally removed from collections. Also removed the now-unused `handleRemoveList` function and `removeListFromCollection` import.

3. **`lib/database.ts`** - Updated schema to:
   - Add `list_name` and `list_description` columns to `collection_lists` table
   - Make `list_id` nullable (no longer has CASCADE delete)
   - Added migration logic (v2) to migrate existing data from old schema

4. **`lib/repository.ts`** - Updated `addListToCollection` to store list name/description directly in collection_lists. Updated `getCollectionLists` to use stored list_name/list_description, falling back gracefully if the original list was deleted.

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