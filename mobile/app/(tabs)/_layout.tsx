import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { Home, Camera, Clock, User } from 'lucide-react-native';
import { useUserContext } from '../../context/UserContext';

export default function TabLayout() {
  const { colors } = useUserContext();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: colors.tabBarBorder,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginBottom: 4 }} />}
              <Home size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              alignItems: 'center',
              justifyContent: 'center',
              ...(focused ? {
                backgroundColor: colors.surface,
                borderRadius: 16,
                width: 48,
                height: 48,
                marginTop: -8,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              } : {}),
            }}>
              <Camera size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginBottom: 4 }} />}
              <Clock size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent, marginBottom: 4 }} />}
              <User size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // hide from tab bar
        }}
      />
    </Tabs>
  );
}
