/**
 * Theme Context for manual dark/light mode switching
 * Provides theme state and toggle functionality across the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
    colorScheme: ColorScheme;
    themeMode: ThemeMode;
    isDark: boolean;
    toggleTheme: () => void;
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useSystemColorScheme();
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');

    // Determine actual color scheme based on mode
    const colorScheme: ColorScheme = themeMode === 'system'
        ? (systemColorScheme ?? 'light')
        : themeMode;

    const isDark = colorScheme === 'dark';

    const toggleTheme = useCallback(() => {
        setThemeMode((prev) => {
            if (prev === 'system') {
                // If system, switch to opposite of current system theme
                return systemColorScheme === 'dark' ? 'light' : 'dark';
            }
            return prev === 'dark' ? 'light' : 'dark';
        });
    }, [systemColorScheme]);

    const value: ThemeContextType = {
        colorScheme,
        themeMode,
        isDark,
        toggleTheme,
        setThemeMode,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Re-export for compatibility with existing components
export function useColorScheme(): ColorScheme {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        // Fallback for components outside provider
        return 'light';
    }
    return context.colorScheme;
}
