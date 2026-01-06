// Reexport the native module
export * from './src/InstalledApps.types';
export { default } from './src/InstalledAppsModule';

// Re-export getAppIcon for lazy loading
import InstalledAppsModule from './src/InstalledAppsModule';
export const getAppIcon = InstalledAppsModule.getAppIcon.bind(InstalledAppsModule);

