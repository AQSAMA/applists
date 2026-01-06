# App List Manager - Implementation Plan

## Overview
Build an Android "App List Manager" using Expo React Native with Material Design 3. Requires development build for native Android PackageManager access.

---

## Migration: pnpm → Bun (Current Task)

### Reason
Switch to Bun package manager to save storage space on ThinkPad T480 with limited disk space.

**Benefits of Bun:**
- ~3x faster installs than pnpm
- Smaller disk footprint (efficient hardlinks + symlinks)
- Compatible with Expo SDK 54 and EAS Build (Bun 1.2.20 on latest images)

### EAS CLI Setup
- [x] Install `eas-cli` as a dev dependency (`bun add -d eas-cli`)
- [ ] Verify `bun x eas --version`

### Pre-Migration
- [ ] Verify Bun is installed locally (`bun --version`)
- [ ] Ensure working state is committed to git

### Tasks

#### 1. Update eas.json
- [ ] Replace `"pnpm": "8.15.9"` with `"bun": "1.2.20"` in preview profile
- [ ] Remove `"node": "20.19.6"` (let EAS use default)

#### 2. Update GitHub Actions Workflow (.github/workflows/release.yml)
- [ ] Replace `pnpm/action-setup@v2` with `oven-sh/setup-bun@v2`
- [ ] Update Node cache to use `bun.lockb`
- [ ] Change `pnpm install` to `bun install`
- [ ] Update EAS packager from `pnpm` to `bun`

#### 3. Delete pnpm-specific Files
- [ ] Delete `pnpm-lock.yaml`
- [ ] Delete `.npmrc` (contains pnpm-specific `node-linker=hoisted`)

#### 4. Reinstall Dependencies
- [ ] Delete `node_modules/`
- [ ] Run `bun install` to generate `bun.lockb`

#### 5. Test Locally
- [ ] Run `bun run start` — verify Expo dev server starts
- [ ] Run `bun run lint` — verify ESLint works

#### 6. Commit Changes
- [ ] Commit: "chore: migrate from pnpm to bun"

### Files to Modify

| File | Action |
|------|--------|
| `eas.json` | Replace pnpm → bun |
| `.github/workflows/release.yml` | Update to Bun setup |
| `pnpm-lock.yaml` | **DELETE** |
| `.npmrc` | **DELETE** |
| `bun.lockb` | Auto-generated |

### Rollback Plan
```bash
git checkout -- .
pnpm install
```

### Review
*(To be completed after migration)*

---

## APK Size & Startup Performance Optimization (Previous Task)

### Problem
1. APK size is ~90MB, installed size exceeds 100MB
2. Application startup time is very long

### Root Causes Identified
1. **All app icons loaded as Base64 on startup** - `getInstalledApps(true, true)` loads ALL app icons immediately. With 200+ apps, each icon being 50-200KB of Base64 data, this creates massive memory usage and slow startup.
2. **No ProGuard/R8 enabled** - Code shrinking and resource shrinking not enabled for release builds.

### Plan
- [x] **1. Enable ProGuard in app.json** - Add `enableProguardInReleaseBuilds` and `enableShrinkResourcesInReleaseBuilds`
- [x] **2. Export getAppIcon from module** - Add named export in `modules/installed-apps/index.ts`
- [x] **3. Disable icons on startup** - Change `getInstalledApps(true, true)` to `getInstalledApps(true, false)`
- [x] **4. Add updateAppIcon to store** - Add action to update single app's icon in store
- [x] **5. Add lazy icon loading** - Load icon via useEffect when AppListItem renders

### Changes Made
1. **`app.json`**:
   - Added `enableProguardInReleaseBuilds: true` - enables R8/ProGuard code shrinking
   - Added `enableShrinkResourcesInReleaseBuilds: true` - removes unused resources

2. **`modules/installed-apps/index.ts`**:
   - Added named export for `getAppIcon` function (already exists in native module)

3. **`app/(tabs)/index.tsx`**:
   - Changed `getInstalledApps(true, true)` to `getInstalledApps(true, false)`
   - Icons are no longer loaded on app startup

4. **`stores/apps-store.ts`**:
   - Added `updateAppIcon` action to store interface
   - Added implementation to update single app's icon in the apps array

5. **`components/ui/app-list-item.tsx`**:
   - Added `useEffect` and `useState` imports
   - Added `getAppIcon` import from installed-apps module
   - Added `useAppsStore` import for updating store
   - Added local `icon` state initialized from `app.icon`
   - Added useEffect to lazy load icon when item renders (if not already loaded)
   - Changed Image source to use local `icon` state

### Expected Impact
| Metric | Before | After |
|--------|--------|-------|
| APK Size | ~90MB | ~35-50MB |
| Startup Time | ~5-10s | <1s |
| Memory on Start | High (~100MB+) | Low (~20MB) |

### Review
- **ProGuard/R8**: Enables code shrinking which removes unused code and obfuscates the rest
- **Resource shrinking**: Removes unused resources from the APK
- **Lazy icon loading**: Icons are now loaded on-demand as list items appear on screen, rather than all at once on startup
- **Store caching**: Once an icon is loaded, it's stored in the Zustand store so it doesn't need to be reloaded

---

## Rename Lists and Collections (Previous Task)

### Problem
Users need the ability to rename lists and collections after creating them.

### Plan
- [x] **1. Add rename option to List Detail screen** - Add "Rename" option to the options bottom sheet menu in `app/list/[id].tsx`
- [x] **2. Add rename option to Collection Detail screen** - Add "Rename" option to the options bottom sheet menu in `app/collection/[id].tsx`
- [x] **3. Create rename dialog** - Simple text input dialog to enter the new name
- [x] **4. Call existing repository functions** - Use `updateList()` and `updateCollection()` from repository.ts (already exist)

### Changes Made
1. **`app/list/[id].tsx`**:
   - Added `TextInput` import from react-native-paper
   - Added `updateList` import from repository
   - Added `renameDialogVisible` and `newName` state variables
   - Added `handleOpenRenameDialog()` function to open dialog with current name
   - Added `handleRename()` function to call `updateList()` and update local state
   - Added "Rename" option with pencil icon to the options bottom sheet menu
   - Added rename dialog with TextInput for entering new name

2. **`app/collection/[id].tsx`**:
   - Added `TextInput` import from react-native-paper
   - Added `updateCollection` import from repository
   - Added `renameDialogVisible` and `newName` state variables
   - Added `handleOpenRenameDialog()` function to open dialog with current name
   - Added `handleRename()` function to call `updateCollection()` and update local state
   - Added "Rename" option with pencil icon to the options bottom sheet menu
   - Added rename dialog with TextInput for entering new name

### Implementation Details
- Both screens already have a bottom sheet menu with an "Export" option
- We'll add a "Rename" option to each menu
- Use react-native-paper's Dialog component with TextInput for the rename dialog
- After successful rename, update the local state and header title

---

## UI Minimalist Adjustments (Previous Task)

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

---

## GitHub Release Automation

### Goal
Automate APK creation and GitHub Release on tag push.

### Plan
- [x] Create `.github/workflows/release.yml`
- [x] Configure `eas.json`
- [x] Fix CI logging issues (install `eas-cli`, use `tee`)
- [x] Fix `Setup EAS` failure (force `packager: npm` to avoid yarn issues)
- [ ] User to push changes and new tag
- [ ] Verify successful release

---

## CI/CD Fixes (Current Task)

### Problem
The GitHub Actions workflow has several issues that could cause instability or failures:
1. `packager: npm` is set but project uses pnpm (inconsistent)
2. Using `latest` for expo/eas versions (risky - could break unexpectedly)
3. Brittle Build ID extraction using regex on text output (fragile)

### Plan
- [x] **1. Fix packager to use pnpm** - Change `packager: npm` to `packager: pnpm` in the EAS setup step
- [x] **2. Pin expo/eas versions** - Use specific versions instead of `latest`
- [x] **3. Use JSON output for Build ID extraction** - Replace brittle grep with `--json` flag for reliable parsing

### Changes Made
File: `.github/workflows/release.yml`
1. Changed `packager: npm` to `packager: pnpm` (line 31)
2. Pinned `expo-version: ^52.0.0` and `eas-version: ^16.0.0` instead of `latest`
3. Replaced brittle regex-based Build ID extraction with `--json` flag and `jq` parsing
4. Added better error handling with output display on failure

### Review
The CI/CD workflow has been updated with three key improvements:

1. **Packager Consistency**: Now uses `pnpm` to match the project's package manager, ensuring consistent dependency resolution between local development and CI.

2. **Version Pinning**: Expo CLI and EAS CLI versions are now pinned to `^52.0.0` and `^16.0.0` respectively. This prevents unexpected breakages from new releases while still allowing patch updates.

3. **Reliable Build ID Extraction**: Replaced the fragile regex pattern (`grep -oP`) with proper JSON parsing using `--json` flag and `jq`. This is much more robust as it doesn't depend on Expo's human-readable output format.

**To test**: Push a new tag (e.g., `git tag v1.0.1 && git push origin v1.0.1`) and verify the workflow completes successfully.