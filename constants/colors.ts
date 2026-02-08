import { Appearance } from 'react-native';

const lightColors = {
  primary: '#0A84FF',
  primaryDark: '#0066CC',
  secondary: '#5E5CE6',
  success: '#34C759',
  danger: '#FF3B30',
  warning: '#FF9500',

  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
  backgroundTertiary: '#E5E5EA',

  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',

  border: '#D1D1D6',
  borderLight: '#E5E5EA',

  cardBackground: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.08)',

  tabIconDefault: '#8E8E93',
  tabIconSelected: '#0A84FF',
  tabBackground: '#F2F2F7',

  inputBackground: '#F2F2F7',
  inputBorder: '#E5E5EA',

  overlay: 'rgba(0, 0, 0, 0.5)',
};

const darkColors = {
  primary: '#0A84FF',
  primaryDark: '#0066CC',
  secondary: '#5E5CE6',
  success: '#30D158',
  danger: '#FF453A',
  warning: '#FF9F0A',

  background: '#000000',
  backgroundSecondary: '#1C1C1E',
  backgroundTertiary: '#2C2C2E',

  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#48484A',

  border: '#38383A',
  borderLight: '#2C2C2E',

  cardBackground: '#1C1C1E',
  cardShadow: 'rgba(0, 0, 0, 0.4)',

  tabIconDefault: '#8E8E93',
  tabIconSelected: '#0A84FF',
  tabBackground: '#1C1C1E',

  inputBackground: '#2C2C2E',
  inputBorder: '#38383A',

  overlay: 'rgba(0, 0, 0, 0.7)',
};

const colorScheme = Appearance.getColorScheme();
const colors = colorScheme === 'dark' ? darkColors : lightColors;

export default colors;