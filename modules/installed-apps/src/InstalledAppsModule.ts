import { requireNativeModule } from 'expo';

import { AppInfo } from './InstalledApps.types';

interface InstalledAppsModuleType {
  getInstalledApps(includeSystemApps: boolean, includeIcons: boolean): Promise<AppInfo[]>;
  getAppIcon(packageName: string): Promise<string | null>;
  isAppInstalled(packageName: string): boolean;
  getAppDetails(packageName: string): Promise<AppInfo | null>;
}

// Mock module for when native module is not available (e.g., Expo Go)
const MockModule: InstalledAppsModuleType = {
  getInstalledApps: async () => [],
  getAppIcon: async () => null,
  isAppInstalled: () => false,
  getAppDetails: async () => null,
};

// This call loads the native module object from the JSI.
let module: InstalledAppsModuleType;
try {
  module = requireNativeModule<InstalledAppsModuleType>('InstalledApps');
} catch {
  console.warn('InstalledApps native module not available. Using mock. Run with a development build for full functionality.');
  module = MockModule;
}

export default module;
