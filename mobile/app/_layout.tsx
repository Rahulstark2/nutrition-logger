import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';
import { UserProvider, useUserContext } from '../context/UserContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function InnerLayout() {
  const { colors, isDark } = useUserContext();

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.background,
      border: colors.cardBorder,
      primary: colors.accent,
      text: colors.text,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="result" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <StatusBar style={colors.statusBar} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <UserProvider>
      <InnerLayout />
    </UserProvider>
  );
}
