// App info returned from native module
export interface AppInfo {
  title: string;
  packageName: string;
  version: string;
  versionCode: number;
  isSystem: boolean;
  apkSize: number;
  installTime: number;
  lastUpdateTime: number;
  minSDK: number;
  targetSDK: number;
  icon: string | null;
}

// Extended app info with additional fields for lists
export interface ListAppInfo extends AppInfo {
  cacheSize?: number;
  dataSize?: number;
}

// List export/import schema
export interface AppListSchema {
  version: number;
  title: string;
  date: number;
  apps: ListAppInfo[];
}

// Collection export schema
export interface CollectionSchema {
  version: number;
  title: string;
  date: number;
  lists: AppListSchema[];
}
