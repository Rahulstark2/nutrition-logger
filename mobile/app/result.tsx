import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, Zap, ChevronDown } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

// --- Mini ring for energy density ---
function EnergyRing({ size = 48 }: { size?: number }) {
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
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke="#1A1A2E" strokeWidth={strokeWidth} fill="none" />
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
function MacroMiniBar({ color, percentage }: { color: string; percentage: number }) {
  return (
    <View style={{ height: 4, width: 40, borderRadius: 2, backgroundColor: '#1A1A2E', marginTop: 4 }}>
      <View style={{ height: 4, width: `${percentage}%` as any, borderRadius: 2, backgroundColor: color }} />
    </View>
  );
}

// --- Micronutrient Row ---
function MicroRow({ icon, name, value, unit, dv }: {
  icon: string; name: string; value: string; unit: string; dv: string;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
    }}>
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
      }}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <Text style={{ flex: 1, color: '#EEEEF0', fontSize: 15, fontWeight: '600' }}>{name}</Text>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ color: '#EEEEF0', fontSize: 15, fontWeight: '700' }}>{value}{unit}</Text>
        <Text style={{ color: '#00D4AA', fontSize: 11, fontWeight: '600' }}>{dv}</Text>
      </View>
    </View>
  );
}

import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
export default function ResultScreen() {
  const params = useLocalSearchParams();
  const [saving, setSaving] = useState(false);
  
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
      
      const response = await fetch('http://172.20.10.13:3000/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, foodData: resultLog })
      });
      const result = await response.json();
      
      if (!result.success) throw new Error(result.error || 'Failed to log');
      
      router.back();
    } catch (e: any) {
      console.log('Logging Error:', e);
      Alert.alert('Error', 'Failed to securely save to database via backend server');
      setSaving(false);
    }
  };

  const foodData = {
    name: resultLog ? (resultLog.food_name || resultLog.name) : 'Analyzing...',
    category: resultLog ? 'Analyzed Result' : 'Loading',
    serving: 'Standard Serving',
    confidence: 98,
    calories: resultLog ? resultLog.calories : 0,
    protein: resultLog ? (resultLog.protein_g ?? resultLog.protein ?? 0) : 0,
    carbs: resultLog ? (resultLog.carbs_g ?? resultLog.carbs ?? 0) : 0,
    fat: resultLog ? (resultLog.fat_g ?? resultLog.fat ?? 0) : 0,
    micros: [
      { icon: '🌾', name: 'Dietary Fiber', value: String(resultLog?.fiber_g ?? resultLog?.fiber ?? '0'), unit: 'g', dv: '-' },
    ],
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B12' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 }}>
          <Text style={{ color: '#EEEEF0', fontSize: 18, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>NutriSnap</Text>
        </View>

        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 20, paddingVertical: 8, marginBottom: 12 }}>
          <ArrowLeft size={24} color="#EEEEF0" />
        </TouchableOpacity>

        {/* Food Name */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ color: '#EEEEF0', fontSize: 32, fontWeight: '800', textTransform: 'capitalize' }}>{foodData.name}</Text>
          <Text style={{ color: '#555570', fontSize: 14, marginTop: 4 }}>{foodData.category} • {foodData.serving}</Text>
        </View>

        {/* Energy Density Card */}
        <View style={{
          marginHorizontal: 20, backgroundColor: '#141420', borderRadius: 24,
          padding: 20, borderWidth: 1, borderColor: '#252540', marginBottom: 24,
        }}>
          <Text style={{ color: '#555570', fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Energy Density</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ color: '#EEEEF0', fontSize: 48, fontWeight: '800' }}>{foodData.calories}</Text>
              <Text style={{ color: '#8888A0', fontSize: 16, fontWeight: '600' }}>KCAL</Text>
            </View>
            <EnergyRing />
          </View>

          {/* Macro Breakdown */}
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 24 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: '#22C55E', fontSize: 11, fontWeight: '700' }}>PROTEIN</Text>
                <Text style={{ color: '#22C55E', fontSize: 14, fontWeight: '800' }}>{foodData.protein}g</Text>
              </View>
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: '#3B82F6', fontSize: 11, fontWeight: '700' }}>CARBS</Text>
                <Text style={{ color: '#3B82F6', fontSize: 14, fontWeight: '800' }}>{foodData.carbs}g</Text>
              </View>
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '700' }}>FATS</Text>
                <Text style={{ color: '#F97316', fontSize: 14, fontWeight: '800' }}>{foodData.fat}g</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detailed Micronutrients */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#EEEEF0', fontSize: 18, fontWeight: '700' }}>Detailed Micronutrients</Text>
            <Text style={{ color: '#555570', fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>Per {foodData.serving}</Text>
          </View>
          <View style={{ backgroundColor: '#141420', borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: '#252540' }}>
            {foodData.micros.map((micro, i) => (
              <MicroRow key={i} {...micro} />
            ))}
          </View>
        </View>

        {/* Add to Log Button (Hidden in View Mode) */}
        {params.isViewOnly !== 'true' && (
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <TouchableOpacity
              onPress={handleAddToLog}
              disabled={saving}
              style={{
                borderRadius: 20,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                overflow: 'hidden',
                backgroundColor: saving ? '#3B82F680' : '#3B82F6',
              }}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#EEEEF0', fontSize: 16, fontWeight: '800' }}>Add to Log</Text>
              )}
            </TouchableOpacity>
          </View>
        )}



      </ScrollView>
    </SafeAreaView>
  );
}
