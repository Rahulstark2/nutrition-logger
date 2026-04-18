import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Zap } from 'lucide-react-native';
import { useUserContext } from '../context/UserContext';

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);
  const { colors } = useUserContext();

  async function signInWithGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'nutrientslogger://login-callback',
      },
    });
    if (error) console.warn(error);
    setLoading(false);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', paddingHorizontal: 24 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: colors.accent, marginBottom: 20,
        }}>
          <Zap size={36} color={colors.accent} />
        </View>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase' }}>NutriSnap</Text>
        <Text style={{ color: colors.textMuted, fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
          Track your macros instantly with AI.
        </Text>
      </View>

      {/* Auth Buttons */}
      <View style={{ gap: 14 }}>
        <TouchableOpacity
          onPress={signInWithGoogle}
          disabled={loading}
          style={{
            backgroundColor: colors.card, paddingVertical: 18, borderRadius: 18,
            alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder,
            flexDirection: 'row', justifyContent: 'center', gap: 10,
          }}
        >
          <Text style={{ fontSize: 18 }}>🔵</Text>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            disabled={loading}
            style={{
              backgroundColor: colors.card, paddingVertical: 18, borderRadius: 18,
              alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder,
              flexDirection: 'row', justifyContent: 'center', gap: 10,
            }}
          >
            <Text style={{ fontSize: 18 }}>🍎</Text>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Continue with Apple</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={{ paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 8 }}
        >
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>Skip for Developer Preview</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
