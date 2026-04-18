import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Bell, Zap, ChevronDown } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useState } from 'react';
import { useUserContext } from '../context/UserContext';
import { supabase } from '../lib/supabase';
import { API_ENDPOINTS } from '../lib/apiConfig';

// --- Mini ring for energy density ---
function EnergyRing({ size = 48, ringTrack }: { size?: number; ringTrack: string }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = 1; // Set to 100% so it looks like a complete badge, not a progress bar
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#6366F1" />
            <Stop offset="100%" stopColor="#818CF8" />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={ringTrack} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#energyGrad)" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Zap size={16} color="#818CF8" />
      </View>
    </View>
  );
}

// --- Macro Progress Bar ---
function MacroMiniBar({ color, percentage, trackColor }: { color: string; percentage: number; trackColor: string }) {
  return (
    <View style={{ height: 4, width: 40, borderRadius: 2, backgroundColor: trackColor, marginTop: 4 }}>
      <View style={{ height: 4, width: `${percentage}%` as any, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
}

// --- Micronutrient Row ---
function MicroRow({ icon, name, value, unit, dv, colors }: {
  icon: string; name: string; value: string; unit: string; dv: string; colors: any;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: colors.surface,
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
      }}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' }}>{name}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>{value}{unit}</Text>
        <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '600' }}>{dv}</Text>
      </View>
    </View>
  );
}

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);
  const { colors } = useUserContext();
  
  let resultLog: any = null;
  if (params.data && typeof params.data === 'string') {
    try {
      resultLog = JSON.parse(params.data);
    } catch (e) { }
  }

  const handleAddToLog = async () => {
    if (!resultLog) {
      router.back();
      return;
    }
    
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Auth Error', 'You must be logged in to save.');
        setSaving(false);
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.LOG_MEAL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, foodData: resultLog })
      });
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error || 'Failed to log');
      
      Alert.alert('Success', 'Meal logged successfully!');
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const isViewOnly = params.isViewOnly === 'true';

  if (!resultLog) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder }}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Analysis</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Main Card */}
        <View style={{ marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 32, padding: 24, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 4, textTransform: 'capitalize' }}>{resultLog.food_name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 15, fontWeight: '500' }}>Calculated per serving</Text>
            </View>
            <EnergyRing ringTrack={colors.ringTrack} />
          </View>

          <View style={{ marginTop: 32 }}>
            <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>{resultLog.calories}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginTop: 2 }}>Total Calories</Text>
            </View>
          </View>
        </View>

        {/* Macros Section */}
        <View style={{ paddingHorizontal: 20, marginBottom: 32 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Macronutrients</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
             {[
               { label: 'Protein', value: resultLog.protein_g, color: '#22C55E' },
               { label: 'Carbs', value: resultLog.carbs_g, color: '#3B82F6' },
               { label: 'Fats', value: resultLog.fat_g, color: '#F97316' }
             ].map((macro) => (
                <View key={macro.label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.cardBorder }}>
                  <Text style={{ color: macro.color, fontSize: 18, fontWeight: '800' }}>{macro.value}g</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{macro.label}</Text>
                  <MacroMiniBar trackColor={colors.surface} color={macro.color} percentage={Math.min((macro.value / 50) * 100, 100)} />
                </View>
             ))}
          </View>
        </View>

        {/* Micronutrients */}
        <View style={{ paddingHorizontal: 20, marginBottom: 120 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Micronutrients</Text>
            <ChevronDown size={20} color={colors.textMuted} />
          </View>
          <View style={{ backgroundColor: colors.card, borderRadius: 24, paddingHorizontal: 20, borderWidth: 1, borderColor: colors.cardBorder }}>
             <MicroRow colors={colors} icon="🌾" name="Dietary Fiber" value={String(resultLog.fiber_g || 0)} unit="g" dv={`${Math.round(((resultLog.fiber_g || 0) / 28) * 100)}% DV`} />
          </View>
        </View>

      </ScrollView>

      {/* Floating Action Button */}
      {!isViewOnly && (
        <View style={{ position: 'absolute', bottom: 34, left: 20, right: 20 }}>
          <TouchableOpacity
            disabled={saving}
            onPress={handleAddToLog}
            activeOpacity={0.9}
            style={{
              backgroundColor: colors.text,
              height: 64,
              borderRadius: 22,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 8,
            }}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Zap size={20} color={colors.background} style={{ marginRight: 10 }} />
                <Text style={{ color: colors.background, fontSize: 17, fontWeight: '800' }}>Add to Daily Log</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
