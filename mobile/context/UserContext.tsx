import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors, ThemeColors } from '../constants/colors';
import { Appearance } from 'react-native';

type ThemeMode = 'System' | 'Dark' | 'Light';

type UserContextType = {
  dailyGoal: number;
  setDailyGoal: (val: number) => void;
  isLoaded: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: ThemeColors;
  isDark: boolean;
};

const UserContext = createContext<UserContextType>({
  dailyGoal: 2200,
  setDailyGoal: () => {},
  isLoaded: false,
  themeMode: 'Dark',
  setThemeMode: () => {},
  colors: DarkColors,
  isDark: true,
});

function resolveColors(mode: ThemeMode): { colors: ThemeColors; isDark: boolean } {
  if (mode === 'Light') return { colors: LightColors, isDark: false };
  if (mode === 'Dark') return { colors: DarkColors, isDark: true };
  // System
  const systemScheme = Appearance.getColorScheme();
  return systemScheme === 'light'
    ? { colors: LightColors, isDark: false }
    : { colors: DarkColors, isDark: true };
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [dailyGoal, setDailyGoal] = useState<number>(2200);
  const [isLoaded, setIsLoaded] = useState(false);
  const [themeMode, setThemeModeState] = useState<ThemeMode>('Dark');
  const [colors, setColors] = useState<ThemeColors>(DarkColors);
  const [isDark, setIsDark] = useState(true);

  const applyTheme = (mode: ThemeMode) => {
    const resolved = resolveColors(mode);
    setColors(resolved.colors);
    setIsDark(resolved.isDark);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    applyTheme(mode);
    await AsyncStorage.setItem('nutrisnap_theme', mode);
  };

  useEffect(() => {
    // Load saved theme
    const loadTheme = async () => {
      const saved = await AsyncStorage.getItem('nutrisnap_theme');
      if (saved === 'Light' || saved === 'Dark' || saved === 'System') {
        setThemeModeState(saved);
        applyTheme(saved);
      }
    };
    loadTheme();

    // Globally fetch user goal automatically on app boot
    const fetchGoal = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('users').select('daily_goal').eq('id', session.user.id).single();
        if (data && data.daily_goal) {
          setDailyGoal(data.daily_goal);
        }
      }
      setIsLoaded(true);
    };
    fetchGoal();

    // Re-fetch if they login seamlessly
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchGoal();
      else setIsLoaded(true); // If no session, it's "loaded" as guest/logged out
    });

    // Listen for system theme changes
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'System') {
        applyTheme('System');
      }
    });

    return () => {
      listener.subscription.unsubscribe();
      sub.remove();
    };
  }, []);

  return (
    <UserContext.Provider value={{ dailyGoal, setDailyGoal, isLoaded, themeMode, setThemeMode, colors, isDark }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  return useContext(UserContext);
}
