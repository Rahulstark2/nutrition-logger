import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Zap } from 'lucide-react-native';

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B12', justifyContent: 'center', paddingHorizontal: 24 }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Logo */}
      <View style={{ alignItems: 'center', marginBottom: 48 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: '#141420', alignItems: 'center', justifyContent: 'center',
          borderWidth: 2, borderColor: '#00D4AA', marginBottom: 20,
        }}>
          <Zap size={36} color="#00D4AA" />
        </View>
        <Text style={{ color: '#EEEEF0', fontSize: 32, fontWeight: '800', letterSpacing: 3, textTransform: 'uppercase' }}>NutriSnap</Text>
        <Text style={{ color: '#555570', fontSize: 15, marginTop: 8, textAlign: 'center', lineHeight: 22 }}>
          Track your macros instantly with AI.
        </Text>
      </View>

      {/* Auth Buttons */}
      <View style={{ gap: 14 }}>
        <TouchableOpacity
          onPress={signInWithGoogle}
          disabled={loading}
          style={{
            backgroundColor: '#141420', paddingVertical: 18, borderRadius: 18,
            alignItems: 'center', borderWidth: 1, borderColor: '#252540',
            flexDirection: 'row', justifyContent: 'center', gap: 10,
          }}
        >
          <Text style={{ fontSize: 18 }}>🔵</Text>
          <Text style={{ color: '#EEEEF0', fontWeight: '700', fontSize: 16 }}>Continue with Google</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            disabled={loading}
            style={{
              backgroundColor: '#141420', paddingVertical: 18, borderRadius: 18,
              alignItems: 'center', borderWidth: 1, borderColor: '#252540',
              flexDirection: 'row', justifyContent: 'center', gap: 10,
            }}
          >
            <Text style={{ fontSize: 18 }}>🍎</Text>
            <Text style={{ color: '#EEEEF0', fontWeight: '700', fontSize: 16 }}>Continue with Apple</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={{ paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginTop: 8 }}
        >
          <Text style={{ color: '#00D4AA', fontWeight: '700', fontSize: 14 }}>Skip for Developer Preview</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
