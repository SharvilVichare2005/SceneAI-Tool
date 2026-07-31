/**
 * Enhanced color theme for dark and light modes
 * Premium design with modern color palette
 */

import { Platform } from 'react-native';

const tintColorLight = '#6366F1'; // Indigo
const tintColorDark = '#818CF8';  // Light indigo

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    primary: '#6366F1',
    primaryLight: '#A5B4FC',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    border: '#E2E8F0',
    shadow: 'rgba(0, 0, 0, 0.1)',
    buttonBackground: '#6366F1',
    buttonText: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    card: '#1E293B',
    cardBorder: '#334155',
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    primary: '#818CF8',
    primaryLight: '#6366F1',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    border: '#334155',
    shadow: 'rgba(0, 0, 0, 0.3)',
    buttonBackground: '#818CF8',
    buttonText: '#0F172A',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
