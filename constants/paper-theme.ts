import type { MD3Theme } from 'react-native-paper';
import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

// Material 3 color scheme - primary blue/teal palette
const lightColors = {
  primary: '#0061A4',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D1E4FF',
  onPrimaryContainer: '#001D36',
  secondary: '#535F70',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#D7E3F7',
  onSecondaryContainer: '#101C2B',
  tertiary: '#6B5778',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#F2DAFF',
  onTertiaryContainer: '#251431',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',
  background: '#FDFCFF',
  onBackground: '#1A1C1E',
  surface: '#FDFCFF',
  onSurface: '#1A1C1E',
  surfaceVariant: '#DFE2EB',
  onSurfaceVariant: '#43474E',
  outline: '#73777F',
  outlineVariant: '#C3C7CF',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#2F3033',
  inverseOnSurface: '#F1F0F4',
  inversePrimary: '#9ECAFF',
  elevation: {
    level0: 'transparent',
    level1: '#F1F4FB',
    level2: '#EAF0F9',
    level3: '#E4ECF7',
    level4: '#E1EAF6',
    level5: '#DCE7F4',
  },
  surfaceDisabled: 'rgba(26, 28, 30, 0.12)',
  onSurfaceDisabled: 'rgba(26, 28, 30, 0.38)',
  backdrop: 'rgba(44, 49, 55, 0.4)',
};

const darkColors = {
  primary: '#9ECAFF',
  onPrimary: '#003258',
  primaryContainer: '#00497D',
  onPrimaryContainer: '#D1E4FF',
  secondary: '#BBC7DB',
  onSecondary: '#253140',
  secondaryContainer: '#3B4858',
  onSecondaryContainer: '#D7E3F7',
  tertiary: '#D6BEE4',
  onTertiary: '#3B2948',
  tertiaryContainer: '#533F5F',
  onTertiaryContainer: '#F2DAFF',
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',
  background: '#1A1C1E',
  onBackground: '#E2E2E6',
  surface: '#1A1C1E',
  onSurface: '#E2E2E6',
  surfaceVariant: '#43474E',
  onSurfaceVariant: '#C3C7CF',
  outline: '#8D9199',
  outlineVariant: '#43474E',
  shadow: '#000000',
  scrim: '#000000',
  inverseSurface: '#E2E2E6',
  inverseOnSurface: '#2F3033',
  inversePrimary: '#0061A4',
  elevation: {
    level0: 'transparent',
    level1: '#21252A',
    level2: '#262B31',
    level3: '#2B3038',
    level4: '#2D323A',
    level5: '#30363F',
  },
  surfaceDisabled: 'rgba(226, 226, 230, 0.12)',
  onSurfaceDisabled: 'rgba(226, 226, 230, 0.38)',
  backdrop: 'rgba(44, 49, 55, 0.4)',
};

const fontConfig = {
  fontFamily: 'System',
};

export const LightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const DarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
  fonts: configureFonts({ config: fontConfig }),
};

// Status colors
export const StatusColors = {
  installed: '#4CAF50',
  missing: '#FF9800',
  system: '#9E9E9E',
};

// Tag colors for labels
export const TagColors = [
  '#F44336', // Red
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#673AB7', // Deep Purple
  '#3F51B5', // Indigo
  '#2196F3', // Blue
  '#03A9F4', // Light Blue
  '#00BCD4', // Cyan
  '#009688', // Teal
  '#4CAF50', // Green
  '#8BC34A', // Light Green
  '#CDDC39', // Lime
  '#FFEB3B', // Yellow
  '#FFC107', // Amber
  '#FF9800', // Orange
  '#FF5722', // Deep Orange
];
