// Centralized theme color tokens for NutriSnap
// Keep in sync with instruction.txt: same design system, no new colors — only light/dark variants

export type ThemeColors = {
  background: string;
  card: string;
  cardBorder: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentSoft: string;
  ring: string;
  ringTrack: string;
  overlay: string;
  inputBg: string;
  inputBorder: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  tabBar: string;
  tabBarBorder: string;
  statusBar: 'light' | 'dark';
};

export const DarkColors: ThemeColors = {
  background: '#0B0B12',
  card: '#141420',
  cardBorder: '#252540',
  surface: '#1A1A2E',
  surfaceBorder: '#303050',
  text: '#EEEEF0',
  textSecondary: '#8888A0',
  textMuted: '#555570',
  accent: '#00D4AA',
  accentSoft: '#00D4AA20',
  ring: '#00D4AA',
  ringTrack: '#1A1A2E',
  overlay: 'rgba(11, 11, 18, 0.85)',
  inputBg: '#141420',
  inputBorder: '#252540',
  danger: '#EF4444',
  dangerBg: '#1A0A0A',
  dangerBorder: '#3A1515',
  tabBar: '#0B0B12',
  tabBarBorder: '#1A1A2E',
  statusBar: 'light',
};

export const LightColors: ThemeColors = {
  background: '#F5F5F7',
  card: '#FFFFFF',
  cardBorder: '#E5E5EA',
  surface: '#F0F0F5',
  surfaceBorder: '#DCDCE5',
  text: '#1C1C1E',
  textSecondary: '#6E6E80',
  textMuted: '#9999AA',
  accent: '#00A883',
  accentSoft: '#00A88320',
  ring: '#00A883',
  ringTrack: '#E8E8F0',
  overlay: 'rgba(245, 245, 247, 0.92)',
  inputBg: '#FFFFFF',
  inputBorder: '#E5E5EA',
  danger: '#EF4444',
  dangerBg: '#FFF0F0',
  dangerBorder: '#FDD',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
  statusBar: 'dark',
};
