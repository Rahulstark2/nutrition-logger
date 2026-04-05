import { View, Text, ScrollView, TouchableOpacity, Dimensions, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, Camera, Send, Trash2 } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRef } from 'react';

const { width } = Dimensions.get('window');

// --- Circular Progress Ring Component ---
function CalorieRing({ current, target, size = 180, strokeWidth = 10 }: {
  current: number; target: number; size?: number; strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(current / target, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#6366F1" />
            <Stop offset="100%" stopColor="#818CF8" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="#1A1A2E" strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#ringGrad)" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ color: '#EEEEF0', fontSize: 42, fontWeight: '800' }}>{current.toLocaleString()}</Text>
        <Text style={{ color: '#8888A0', fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}>KCAL TOTAL</Text>
      </View>
    </View>
  );
}

// --- Clean Macro Stat Component ---
function MacroStat({ label, value, unit, color }: {
  label: string; value: number; unit: string; color: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: '#141420', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#252540' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
         <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
         <Text style={{ color: '#555570', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>
      </View>
      <Text style={{ color: '#EEEEF0', fontSize: 24, fontWeight: '800', marginTop: 12 }}>{value}<Text style={{ fontSize: 12, color: '#8888A0', fontWeight: '700' }}>{unit}</Text></Text>
    </View>
  );
}

// --- Swipe-to-Delete Meal Card ---
function MealCard({ id, name, mealType, time, calories, protein, carbs, fat, fiber, onDelete }: {
  id: string; name: string; mealType: string; time: string; calories: number;
  protein?: number; carbs?: number; fat?: number; fiber?: number; onDelete: (id: string, name: string) => void;
}) {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [72, 0],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity
        onPress={() => {
          swipeableRef.current?.close();
          onDelete(id, name);
        }}
        activeOpacity={0.7}
        style={{
          width: 72,
          marginBottom: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Animated.View style={{
          flex: 1,
          width: '100%',
          backgroundColor: '#DC2626',
          borderRadius: 20,
          justifyContent: 'center',
          alignItems: 'center',
          transform: [{ translateX }],
        }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Trash2 size={18} color="#FFFFFF" />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={() => {
          const logData = {
            food_name: name,
            calories: calories,
            protein_g: protein,
            carbs_g: carbs,
            fat_g: fat,
            fiber_g: fiber || 0,
          };
          router.push({
            pathname: '/result',
            params: { data: JSON.stringify(logData), isViewOnly: 'true' }
          });
        }}
        style={{
          backgroundColor: '#141420',
          borderRadius: 20,
          padding: 16,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#252540',
        }}>
        <View style={{ flex: 1, paddingLeft: 6 }}>
          <Text style={{ color: '#EEEEF0', fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>{name}</Text>
          <Text style={{ color: '#555570', fontSize: 12, marginTop: 4 }}>Today • {time}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
          <Text style={{ color: '#EEEEF0', fontSize: 22, fontWeight: '800' }}>{calories}</Text>
          <Text style={{ color: '#555570', fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>KCAL</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { useUserContext } from '../../context/UserContext';
import { ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

// --- Main Dashboard ---
export default function Dashboard() {
  const { dailyGoal, isLoaded } = useUserContext();
  const [textQuery, setTextQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [meals, setMeals] = useState<any[]>([]);
  
  const [dailyData, setDailyData] = useState({
    calories: 0, target: dailyGoal,
    protein: { value: 0, percentage: 0 },
    carbs: { value: 0, percentage: 0 },
    fat: { value: 0, percentage: 0 },
  });

  const fetchTodayLogs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const now = new Date();
      // Crucial mathematically: Reset at exactly 12:00 AM local time
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', startOfToday)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        let totalCalories = 0; let totalProtein = 0; let totalCarbs = 0; let totalFat = 0;
        
        const mappedMeals = data.map(log => {
           totalCalories += Number(log.calories) || 0;
           totalProtein += Number(log.protein_g) || 0;
           totalCarbs += Number(log.carbs_g) || 0;
           totalFat += Number(log.fat_g) || 0;
           
           return {
             id: log.id,
             name: log.food_name || 'Manual Log',
             mealType: log.meal_type || 'Snack',
             time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
             calories: Number(log.calories) || 0,
             protein: Number(log.protein_g) || 0,
             carbs: Number(log.carbs_g) || 0,
             fat: Number(log.fat_g) || 0,
             fiber: Number(log.fiber_g) || 0
           };
        });
        
        // Define dynamic baseline targets matching the daily goal formula
        const targetProtein = Math.round((dailyGoal * 0.3) / 4) || 1; // 30% of target
        const targetCarbs = Math.round((dailyGoal * 0.4) / 4) || 1;   // 40% of target
        const targetFat = Math.round((dailyGoal * 0.3) / 9) || 1;     // 30% of target
        
        setDailyData({
          calories: totalCalories,
          target: dailyGoal,
          protein: { value: Number(totalProtein.toFixed(1)), percentage: Math.min(Math.round((totalProtein / targetProtein) * 100), 100) },
          carbs: { value: Number(totalCarbs.toFixed(1)), percentage: Math.min(Math.round((totalCarbs / targetCarbs) * 100), 100) },
          fat: { value: Number(totalFat.toFixed(1)), percentage: Math.min(Math.round((totalFat / targetFat) * 100), 100) },
        });
        
        setMeals(mappedMeals);
      }
    } catch (err) {
      console.log('Error fetching logs', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchTodayLogs();
    }, [dailyGoal, isLoaded])
  );

  useEffect(() => {
    if (isLoaded) {
      setDailyData(prev => ({ ...prev, target: dailyGoal }));
    }
  }, [dailyGoal, isLoaded]);

  const handleDeleteMeal = (id: string, name: string) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to remove ${name} from today's log?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            // Optimistic deletion from UI
            setMeals(curr => curr.filter(m => m.id !== id));
            
            // Background database deletion
            const { error } = await supabase.from('logs').delete().eq('id', id);
            if (error) {
               Alert.alert('Error', 'Failed to delete from server.');
            }
            
            // Re-fetch to recalculate the main calorie ring natively
            fetchTodayLogs();
          }
        }
      ]
    );
  };

  const handleManualLog = async () => {
    if (!textQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Auth Error', 'You must be logged in to log meals.');
        return;
      }
      
      const response = await fetch('http://172.20.10.13:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id, textQuery })
      });
      const result = await response.json();
      
      if (result.success) {
        router.push({ pathname: '/result', params: { data: JSON.stringify(result.log) } });
      } else {
        Alert.alert('Error', result.error || 'Failed to process request');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Network Error', 'Could not connect to backend server on localhost:3000');
    } finally {
      setLoading(false);
      setTextQuery('');
    }
  };

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0B12', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B12' }}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: '#EEEEF0', fontSize: 18, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>NutriSnap</Text>
        </View>

        {/* Today's Intaker Card */}
        <View style={{ marginHorizontal: 20, backgroundColor: '#141420', borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#252540', marginBottom: 24 }}>
          <Text style={{ color: '#555570', fontSize: 11, fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>Today's Intake</Text>
          <CalorieRing current={dailyData.calories} target={dailyData.target} />
          <Text style={{ color: '#555570', fontSize: 13, marginTop: 8 }}>Target: {dailyData.target.toLocaleString()}</Text>
        </View>

        {/* Macro Layout */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 32, gap: 12 }}>
          <MacroStat label="Protein" value={dailyData.protein.value} unit="g" color="#22C55E" />
          <MacroStat label="Carbs" value={dailyData.carbs.value} unit="g" color="#3B82F6" />
          <MacroStat label="Fats" value={dailyData.fat.value} unit="g" color="#F97316" />
        </View>

        {/* Logging Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
            <View style={{
              flex: 1, backgroundColor: '#141420', borderRadius: 18, 
              paddingHorizontal: 16, paddingVertical: 8,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              borderWidth: 1, borderColor: '#252540',
            }}>
              <TextInput 
                placeholder="Log food manually..."
                placeholderTextColor="#555570"
                value={textQuery}
                onChangeText={setTextQuery}
                editable={!loading}
                style={{ flex: 1, color: '#EEEEF0', fontSize: 15, fontWeight: '600', paddingVertical: 8 }}
                onSubmitEditing={handleManualLog}
              />
              <TouchableOpacity 
                onPress={handleManualLog}
                disabled={loading}
                style={{
                width: 38, height: 38, borderRadius: 12, backgroundColor: '#00D4AA', 
                alignItems: 'center', justifyContent: 'center'
              }}>
                {loading ? <ActivityIndicator color="#0B0B12" /> : <Send size={18} color="#0B0B12" />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Snap Food Button */}
          <TouchableOpacity
            onPress={() => router.push('/scanner')}
            style={{
              backgroundColor: '#00D4AA',
              borderRadius: 20,
              paddingVertical: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <Camera size={20} color="#0B0B12" />
            <Text style={{ color: '#0B0B12', fontSize: 16, fontWeight: '800' }}>Snap Food</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Meals */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#EEEEF0', fontSize: 20, fontWeight: '700' }}>Recent Meals</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={{ color: '#00D4AA', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>See History</Text>
            </TouchableOpacity>
          </View>
          {meals.map((meal) => (
            <MealCard key={meal.id} {...meal} onDelete={handleDeleteMeal} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}
