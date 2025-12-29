import * as SQLite from 'expo-sqlite';

const DB_NAME = 'applists.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- Lists table
    CREATE TABLE IF NOT EXISTS lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Collections table
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Collection-List relationship (many-to-many)
    CREATE TABLE IF NOT EXISTS collection_lists (
      collection_id INTEGER NOT NULL,
      list_id INTEGER NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (collection_id, list_id),
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );

    -- Apps in lists
    CREATE TABLE IF NOT EXISTS list_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER NOT NULL,
      package_name TEXT NOT NULL,
      title TEXT NOT NULL,
      version TEXT,
      version_code INTEGER,
      is_system INTEGER NOT NULL DEFAULT 0,
      apk_size INTEGER DEFAULT 0,
      cache_size INTEGER DEFAULT 0,
      data_size INTEGER DEFAULT 0,
      install_time INTEGER,
      last_update_time INTEGER,
      min_sdk INTEGER,
      target_sdk INTEGER,
      added_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
      UNIQUE(list_id, package_name),
      FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE
    );

    -- Tags for apps
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT
    );

    -- App-Tag relationship
    CREATE TABLE IF NOT EXISTS list_app_tags (
      list_app_id INTEGER NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (list_app_id, tag_id),
      FOREIGN KEY (list_app_id) REFERENCES list_apps(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    -- Icon cache
    CREATE TABLE IF NOT EXISTS icon_cache (
      package_name TEXT PRIMARY KEY,
      icon_base64 TEXT NOT NULL,
      cached_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_list_apps_package ON list_apps(package_name);
    CREATE INDEX IF NOT EXISTS idx_collection_lists_collection ON collection_lists(collection_id);

    -- KV Store for theme/settings
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
