import type { ListAppInfo } from "../modules/installed-apps";
import { getDatabase } from "./database";

// List types
export interface AppList {
  id: number;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
  appCount?: number;
}

export interface Collection {
  id: number;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
  listCount?: number;
}

export interface Tag {
  id: number;
  name: string;
  color: string | null;
}

export interface ListApp extends ListAppInfo {
  id: number;
  listId: number;
  addedAt: number;
  tags?: Tag[];
}

// ============ LISTS ============

export async function createList(
  name: string,
  description?: string,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO lists (name, description) VALUES (?, ?)",
    [name, description || null],
  );
  return result.lastInsertRowId;
}

export async function getAllLists(): Promise<AppList[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    description: string | null;
    created_at: number;
    updated_at: number;
    app_count: number;
  }>(`
    SELECT l.*, COUNT(la.id) as app_count
    FROM lists l
    LEFT JOIN list_apps la ON l.id = la.list_id
    GROUP BY l.id
    ORDER BY l.updated_at DESC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    appCount: row.app_count,
  }));
}

export async function getList(id: number): Promise<AppList | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: number;
    name: string;
    description: string | null;
    created_at: number;
    updated_at: number;
  }>("SELECT * FROM lists WHERE id = ?", [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateList(
  id: number,
  name: string,
  description?: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE lists SET name = ?, description = ?, updated_at = ? WHERE id = ?",
    [name, description || null, Date.now(), id],
  );
}

export async function deleteList(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM lists WHERE id = ?", [id]);
}

// ============ LIST APPS ============

export async function addAppToList(
  listId: number,
  app: ListAppInfo,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT OR REPLACE INTO list_apps
     (list_id, package_name, title, version, version_code, is_system, apk_size,
      cache_size, data_size, install_time, last_update_time, min_sdk, target_sdk)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      listId,
      app.packageName,
      app.title,
      app.version,
      app.versionCode,
      app.isSystem ? 1 : 0,
      app.apkSize,
      app.cacheSize || 0,
      app.dataSize || 0,
      app.installTime,
      app.lastUpdateTime,
      app.minSDK,
      app.targetSDK,
    ],
  );

  // Update list's updated_at
  await db.runAsync("UPDATE lists SET updated_at = ? WHERE id = ?", [
    Date.now(),
    listId,
  ]);

  return result.lastInsertRowId;
}

export async function addAppsToList(
  listId: number,
  apps: ListAppInfo[],
): Promise<void> {
  const db = await getDatabase();

  for (const app of apps) {
    await db.runAsync(
      `INSERT OR IGNORE INTO list_apps
       (list_id, package_name, title, version, version_code, is_system, apk_size,
        cache_size, data_size, install_time, last_update_time, min_sdk, target_sdk)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        listId,
        app.packageName,
        app.title,
        app.version,
        app.versionCode,
        app.isSystem ? 1 : 0,
        app.apkSize,
        app.cacheSize || 0,
        app.dataSize || 0,
        app.installTime,
        app.lastUpdateTime,
        app.minSDK,
        app.targetSDK,
      ],
    );
  }

  await db.runAsync("UPDATE lists SET updated_at = ? WHERE id = ?", [
    Date.now(),
    listId,
  ]);
}

export async function getListApps(listId: number): Promise<ListApp[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    list_id: number;
    package_name: string;
    title: string;
    version: string;
    version_code: number;
    is_system: number;
    apk_size: number;
    cache_size: number;
    data_size: number;
    install_time: number;
    last_update_time: number;
    min_sdk: number;
    target_sdk: number;
    added_at: number;
  }>("SELECT * FROM list_apps WHERE list_id = ? ORDER BY title ASC", [listId]);

  return rows.map((row) => ({
    id: row.id,
    listId: row.list_id,
    packageName: row.package_name,
    title: row.title,
    version: row.version,
    versionCode: row.version_code,
    isSystem: row.is_system === 1,
    apkSize: row.apk_size,
    cacheSize: row.cache_size,
    dataSize: row.data_size,
    installTime: row.install_time,
    lastUpdateTime: row.last_update_time,
    minSDK: row.min_sdk,
    targetSDK: row.target_sdk,
    addedAt: row.added_at,
    icon: null,
  }));
}

export async function removeAppFromList(
  listId: number,
  packageName: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "DELETE FROM list_apps WHERE list_id = ? AND package_name = ?",
    [listId, packageName],
  );
  await db.runAsync("UPDATE lists SET updated_at = ? WHERE id = ?", [
    Date.now(),
    listId,
  ]);
}

export async function removeAppsFromList(
  listId: number,
  packageNames: string[],
): Promise<void> {
  const db = await getDatabase();
  const placeholders = packageNames.map(() => "?").join(",");
  await db.runAsync(
    `DELETE FROM list_apps WHERE list_id = ? AND package_name IN (${placeholders})`,
    [listId, ...packageNames],
  );
  await db.runAsync("UPDATE lists SET updated_at = ? WHERE id = ?", [
    Date.now(),
    listId,
  ]);
}

export async function isAppInList(
  listId: number,
  packageName: string,
): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM list_apps WHERE list_id = ? AND package_name = ?",
    [listId, packageName],
  );
  return (row?.count || 0) > 0;
}

export async function getAppListMemberships(
  packageName: string,
): Promise<number[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ list_id: number }>(
    "SELECT list_id FROM list_apps WHERE package_name = ?",
    [packageName],
  );
  return rows.map((r) => r.list_id);
}

export async function getAllListedPackageNames(): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ package_name: string }>(
    "SELECT DISTINCT package_name FROM list_apps",
  );
  return new Set(rows.map((r) => r.package_name));
}

// ============ COLLECTIONS ============

export async function createCollection(
  name: string,
  description?: string,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO collections (name, description) VALUES (?, ?)",
    [name, description || null],
  );
  return result.lastInsertRowId;
}

export async function getAllCollections(): Promise<Collection[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    description: string | null;
    created_at: number;
    updated_at: number;
    list_count: number;
  }>(`
    SELECT c.*, COUNT(cl.list_id) as list_count
    FROM collections c
    LEFT JOIN collection_lists cl ON c.id = cl.collection_id
    GROUP BY c.id
    ORDER BY c.updated_at DESC
  `);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    listCount: row.list_count,
  }));
}

export async function getCollection(id: number): Promise<Collection | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{
    id: number;
    name: string;
    description: string | null;
    created_at: number;
    updated_at: number;
  }>("SELECT * FROM collections WHERE id = ?", [id]);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function updateCollection(
  id: number,
  name: string,
  description?: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE collections SET name = ?, description = ?, updated_at = ? WHERE id = ?",
    [name, description || null, Date.now(), id],
  );
}

export async function deleteCollection(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM collections WHERE id = ?", [id]);
}

export async function addListToCollection(
  collectionId: number,
  listId: number,
): Promise<void> {
  const db = await getDatabase();
  const maxPos = await db.getFirstAsync<{ max_pos: number | null }>(
    "SELECT MAX(position) as max_pos FROM collection_lists WHERE collection_id = ?",
    [collectionId],
  );
  const position = (maxPos?.max_pos ?? -1) + 1;

  await db.runAsync(
    "INSERT OR IGNORE INTO collection_lists (collection_id, list_id, position) VALUES (?, ?, ?)",
    [collectionId, listId, position],
  );
  await db.runAsync("UPDATE collections SET updated_at = ? WHERE id = ?", [
    Date.now(),
    collectionId,
  ]);
}

export async function removeListFromCollection(
  collectionId: number,
  listId: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "DELETE FROM collection_lists WHERE collection_id = ? AND list_id = ?",
    [collectionId, listId],
  );
  await db.runAsync("UPDATE collections SET updated_at = ? WHERE id = ?", [
    Date.now(),
    collectionId,
  ]);
}

export async function getCollectionLists(
  collectionId: number,
): Promise<AppList[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    description: string | null;
    created_at: number;
    updated_at: number;
    app_count: number;
  }>(
    `
    SELECT l.*, COUNT(la.id) as app_count
    FROM lists l
    INNER JOIN collection_lists cl ON l.id = cl.list_id
    LEFT JOIN list_apps la ON l.id = la.list_id
    WHERE cl.collection_id = ?
    GROUP BY l.id
    ORDER BY cl.position ASC
  `,
    [collectionId],
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    appCount: row.app_count,
  }));
}

// ============ TAGS ============

export async function createTag(name: string, color?: string): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO tags (name, color) VALUES (?, ?)",
    [name, color || null],
  );
  return result.lastInsertRowId;
}

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    color: string | null;
  }>("SELECT * FROM tags ORDER BY name ASC");
  return rows;
}

export async function deleteTag(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM tags WHERE id = ?", [id]);
}

export async function addTagToListApp(
  listAppId: number,
  tagId: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR IGNORE INTO list_app_tags (list_app_id, tag_id) VALUES (?, ?)",
    [listAppId, tagId],
  );
}

export async function removeTagFromListApp(
  listAppId: number,
  tagId: number,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "DELETE FROM list_app_tags WHERE list_app_id = ? AND tag_id = ?",
    [listAppId, tagId],
  );
}

export async function getListAppTags(listAppId: number): Promise<Tag[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: number;
    name: string;
    color: string | null;
  }>(
    `
    SELECT t.* FROM tags t
    INNER JOIN list_app_tags lat ON t.id = lat.tag_id
    WHERE lat.list_app_id = ?
    ORDER BY t.name ASC
  `,
    [listAppId],
  );
  return rows;
}

// ============ ICON CACHE ============

export async function getCachedIcon(
  packageName: string,
): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ icon_base64: string }>(
    "SELECT icon_base64 FROM icon_cache WHERE package_name = ?",
    [packageName],
  );
  return row?.icon_base64 || null;
}

export async function cacheIcon(
  packageName: string,
  iconBase64: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "INSERT OR REPLACE INTO icon_cache (package_name, icon_base64, cached_at) VALUES (?, ?, ?)",
    [packageName, iconBase64, Date.now()],
  );
}

export async function clearIconCache(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM icon_cache");
}

// ============ MERGE LISTS ============

export async function mergeLists(
  sourceListIds: number[],
  targetListId: number,
): Promise<void> {
  const db = await getDatabase();

  for (const sourceId of sourceListIds) {
    if (sourceId === targetListId) continue;

    // Move apps from source to target (ignore duplicates)
    await db.runAsync(
      `
      INSERT OR IGNORE INTO list_apps
        (list_id, package_name, title, version, version_code, is_system, apk_size,
         cache_size, data_size, install_time, last_update_time, min_sdk, target_sdk, added_at)
      SELECT ?, package_name, title, version, version_code, is_system, apk_size,
             cache_size, data_size, install_time, last_update_time, min_sdk, target_sdk, added_at
      FROM list_apps WHERE list_id = ?
    `,
      [targetListId, sourceId],
    );

    // Delete source list
    await db.runAsync("DELETE FROM lists WHERE id = ?", [sourceId]);
  }

  await db.runAsync("UPDATE lists SET updated_at = ? WHERE id = ?", [
    Date.now(),
    targetListId,
  ]);
}

// ============ DUPLICATE DETECTION ============

export async function findDuplicatesInCollection(
  collectionId: number,
): Promise<Map<string, number[]>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ package_name: string; list_id: number }>(
    `
    SELECT la.package_name, la.list_id
    FROM list_apps la
    INNER JOIN collection_lists cl ON la.list_id = cl.list_id
    WHERE cl.collection_id = ?
    ORDER BY la.package_name
  `,
    [collectionId],
  );

  const appLists = new Map<string, number[]>();
  for (const row of rows) {
    const lists = appLists.get(row.package_name) || [];
    lists.push(row.list_id);
    appLists.set(row.package_name, lists);
  }

  // Filter to only duplicates (apps in more than one list)
  const duplicates = new Map<string, number[]>();
  for (const [pkg, lists] of appLists) {
    if (lists.length > 1) {
      duplicates.set(pkg, lists);
    }
  }

  return duplicates;
}

// ============ IMPORT/EXPORT ============

export async function exportListData(listId: number): Promise<any> {
  const list = await getList(listId);
  if (!list) throw new Error("List not found");

  const apps = await getListApps(listId);

  return {
    type: "applist",
    version: 1,
    name: list.name,
    description: list.description,
    apps: apps.map((app) => ({
      packageName: app.packageName,
      title: app.title,
      version: app.version,
      versionCode: app.versionCode,
      isSystem: app.isSystem,
      apkSize: app.apkSize,
      installTime: app.installTime,
      lastUpdateTime: app.lastUpdateTime,
      minSDK: app.minSDK,
      targetSDK: app.targetSDK,
    })),
  };
}

export async function importListData(data: any): Promise<number> {
  if (!data || data.type !== "applist") throw new Error("Invalid list data");

  const listId = await createList(data.name, data.description);
  if (data.apps && Array.isArray(data.apps)) {
    await addAppsToList(listId, data.apps);
  }
  return listId;
}

export async function exportCollectionData(collectionId: number): Promise<any> {
  const collection = await getCollection(collectionId);
  if (!collection) throw new Error("Collection not found");

  const lists = await getCollectionLists(collectionId);
  const listsWithApps = await Promise.all(
    lists.map(async (l) => {
      const apps = await getListApps(l.id);
      return {
        name: l.name,
        description: l.description,
        apps: apps.map((app) => ({
          packageName: app.packageName,
          title: app.title,
          version: app.version,
          versionCode: app.versionCode,
          isSystem: app.isSystem,
          apkSize: app.apkSize,
          installTime: app.installTime,
          lastUpdateTime: app.lastUpdateTime,
          minSDK: app.minSDK,
          targetSDK: app.targetSDK,
        })),
      };
    }),
  );

  return {
    type: "appcollection",
    version: 1,
    name: collection.name,
    description: collection.description,
    lists: listsWithApps,
  };
}

export async function importCollectionData(data: any): Promise<number> {
  if (!data || data.type !== "appcollection")
    throw new Error("Invalid collection data");

  const collectionId = await createCollection(data.name, data.description);

  if (data.lists && Array.isArray(data.lists)) {
    for (const listData of data.lists) {
      const listId = await createList(listData.name, listData.description);
      if (listData.apps && Array.isArray(listData.apps)) {
        await addAppsToList(listId, listData.apps);
      }
      await addListToCollection(collectionId, listId);
    }
  }

  return collectionId;
}
