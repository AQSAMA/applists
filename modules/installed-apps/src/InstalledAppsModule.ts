import { requireNativeModule } from 'expo';

import { AppInfo } from './InstalledApps.types';

interface InstalledAppsModuleType {
  getInstalledApps(includeSystemApps: boolean, includeIcons: boolean): Promise<AppInfo[]>;
  getAppIcon(packageName: string): Promise<string | null>;
  isAppInstalled(packageName: string): boolean;
  getAppDetails(packageName: string): Promise<AppInfo | null>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<InstalledAppsModuleType>('InstalledApps');
