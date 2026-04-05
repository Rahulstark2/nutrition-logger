import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

const CustomDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0B0B12',
    card: '#0B0B12',
    border: '#252540',
    primary: '#00D4AA',
    text: '#EEEEF0',
  },
};

import { UserProvider } from '../context/UserContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <ThemeProvider value={CustomDark}>
      <UserProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="result" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
        <StatusBar style="light" />
      </UserProvider>
    </ThemeProvider>
  );
}
