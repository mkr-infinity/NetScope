import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { themes, accentPresets, Theme, AccentKey, ThemeMode } from '@/constants/theme';
import { getSettings, saveSettings } from '@/services/storageService';

interface ThemeContextValue {
  theme: Theme;
  themeMode: ThemeMode;
  accent: AccentKey;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentKey) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const ACCENT_MODES: ThemeMode[] = ['dark', 'light', 'system'];

function resolveBase(mode: ThemeMode, systemDark: boolean): Theme {
  switch (mode) {
    case 'light':   return themes.light;
    case 'amoled':  return themes.amoled;
    case 'hacker':  return themes.hacker;
    case 'ocean':   return themes.ocean;
    case 'sunset':  return themes.sunset;
    case 'system':  return systemDark ? themes.dark : themes.light;
    default:        return themes.dark;
  }
}

function resolveIsDark(mode: ThemeMode, systemDark: boolean): boolean {
  if (mode === 'light') return false;
  if (mode === 'system') return systemDark;
  return true;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [accent, setAccentState] = useState<AccentKey>('blue');

  useEffect(() => {
    getSettings().then(s => {
      setThemeModeState((s.themeMode as ThemeMode) || 'dark');
      setAccentState((s.accent as AccentKey) || 'blue');
    });
  }, []);

  const systemDark = systemScheme === 'dark';
  const isDark = resolveIsDark(themeMode, systemDark);
  const base = resolveBase(themeMode, systemDark);
  const accentOverride = ACCENT_MODES.includes(themeMode)
    ? (accentPresets[accent] || accentPresets.blue)
    : {};
  const theme: Theme = { ...base, ...accentOverride };

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    const s = await getSettings();
    await saveSettings({ ...s, themeMode: mode });
  }, []);

  const setAccent = useCallback(async (a: AccentKey) => {
    setAccentState(a);
    const s = await getSettings();
    await saveSettings({ ...s, accent: a });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, accent, isDark, setThemeMode, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

const DEFAULT_CTX: ThemeContextValue = {
  theme: { ...themes.dark, ...accentPresets.blue },
  themeMode: 'dark',
  accent: 'blue',
  isDark: true,
  setThemeMode: async () => {},
  setAccent: async () => {},
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  return ctx ?? DEFAULT_CTX;
}
