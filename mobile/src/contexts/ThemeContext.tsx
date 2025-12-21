import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  dark: boolean;
  colors: {
    primary: string;
    primaryLight: string;
    background: string;
    surface: string;
    surfaceSecondary: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    borderLight: string;
    error: string;
    success: string;
    warning: string;
  };
}

const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#047857',
    primaryLight: '#ecfdf5',
    background: '#ffffff',
    surface: '#ffffff',
    surfaceSecondary: '#f9fafb',
    text: '#18181b',
    textSecondary: '#52525b',
    textMuted: '#a1a1aa',
    border: '#e4e4e7',
    borderLight: '#f4f4f5',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#eab308',
  },
};

const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#10b981',
    primaryLight: '#064e3b',
    background: '#09090b',
    surface: '#18181b',
    surfaceSecondary: '#27272a',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    border: '#3f3f46',
    borderLight: '#27272a',
    error: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
  },
};

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = '@gkp_theme_dark_mode';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDark(savedTheme === 'true');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const saveThemePreference = async (dark: boolean) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, dark.toString());
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    saveThemePreference(newValue);
  };

  const setDarkMode = (dark: boolean) => {
    setIsDark(dark);
    saveThemePreference(dark);
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
