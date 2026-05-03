import { View, Text, ScrollView, TouchableOpacity, Dimensions, TextInput, Animated, Modal, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bell, Camera, Send, Trash2, Plus, X, ChevronDown, Leaf, Image as ImageIcon } from 'lucide-react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRef } from 'react';

const { width } = Dimensions.get('window');

// --- Circular Progress Ring Component ---
import type { ThemeColors } from '../../constants/colors';

function CalorieRing({ current, target, size = 140, strokeWidth = 8, colors }: {
  current: number; target: number; size?: number; strokeWidth?: number; colors: ThemeColors;
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
          stroke={colors.ringTrack} strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="url(#ringGrad)" strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800' }}>{current.toLocaleString()}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}>KCAL TOTAL</Text>
      </View>
    </View>
  );
}

// --- Clean Macro Stat Component ---
function MacroStat({ label, value, unit, color, themeColors }: {
  label: string; value: number; unit: string; color: string; themeColors: ThemeColors;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: themeColors.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: themeColors.cardBorder }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
         <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
         <Text style={{ color: themeColors.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>
      </View>
      <Text style={{ color: themeColors.text, fontSize: 20, fontWeight: '800', marginTop: 8 }}>{value}<Text style={{ fontSize: 11, color: themeColors.textSecondary, fontWeight: '700' }}>{unit}</Text></Text>
    </View>
  );
}

// --- Swipe-to-Delete Meal Card ---
function MealCard({ id, name, time, calories, protein, carbs, fat, fiber, onDelete, themeColors }: {
  id: string; name: string; time: string; calories: number;
  protein?: number; carbs?: number; fat?: number; fiber?: number; onDelete: (id: string, name: string) => void; themeColors: ThemeColors;
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
          backgroundColor: themeColors.card,
          borderRadius: 16,
          padding: 12,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: themeColors.cardBorder,
        }}>
        <View style={{ flex: 1, paddingLeft: 4 }}>
          <Text style={{ color: themeColors.text, fontSize: 14, fontWeight: '700', textTransform: 'capitalize' }}>{name}</Text>
          <Text style={{ color: themeColors.textMuted, fontSize: 11, marginTop: 2 }}>Today • {time}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
          <Text style={{ color: themeColors.text, fontSize: 18, fontWeight: '800' }}>{calories}</Text>
          <Text style={{ color: themeColors.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 1 }}>KCAL</Text>
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
import * as ImagePicker from 'expo-image-picker';
import { API_ENDPOINTS } from '../../lib/apiConfig';

// --- Main Dashboard ---
export default function Dashboard() {
  const { dailyGoal, isLoaded, colors } = useUserContext();
  const [textQuery, setTextQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const analysisSteps = [
    "Processing Image...",
    "Identifying Nutrients...",
    "Finalizing Results..."
  ];
  
  const [meals, setMeals] = useState<any[]>([]);
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualSaving, setManualSaving] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [galleryText, setGalleryText] = useState('');
  const [galleryModalVisible, setGalleryModalVisible] = useState(false);
  const [manualForm, setManualForm] = useState({
    food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '',
  });
  
  const [dailyData, setDailyData] = useState({
    calories: 0, target: dailyGoal,
    protein: { value: 0, percentage: 0 },
    carbs: { value: 0, percentage: 0 },
    fat: { value: 0, percentage: 0 },
    fiber: 0,
  });
  const [microModalVisible, setMicroModalVisible] = useState(false);

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
        let totalCalories = 0; let totalProtein = 0; let totalCarbs = 0; let totalFat = 0; let totalFiber = 0;
        
        const mappedMeals = data.map(log => {
           totalCalories += Number(log.calories) || 0;
           totalProtein += Number(log.protein_g) || 0;
           totalCarbs += Number(log.carbs_g) || 0;
           totalFat += Number(log.fat_g) || 0;
           totalFiber += Number(log.fiber_g) || 0;
           
           return {
             id: log.id,
             name: log.food_name || 'Manual Log',
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
          fiber: Number(totalFiber.toFixed(1)),
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
      
      const response = await fetch(API_ENDPOINTS.ANALYZE, {
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
      Alert.alert('Network Error', 'Could not connect to backend server.');
    } finally {
      setLoading(false);
      setTextQuery('');
    }
  };

  const handleManualCalorieLog = async () => {
    if (!manualForm.food_name.trim()) {
      Alert.alert('Required', 'Please enter a food name.');
      return;
    }
    if (!manualForm.calories.trim() || isNaN(Number(manualForm.calories))) {
      Alert.alert('Required', 'Please enter valid calories.');
      return;
    }

    setManualSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Auth Error', 'You must be logged in.');
        setManualSaving(false);
        return;
      }

      const payload = {
        userId: session.user.id,
        foodData: {
          food_name: manualForm.food_name.trim(),
          calories: Number(manualForm.calories) || 0,
          protein_g: manualForm.protein_g.trim() ? Number(manualForm.protein_g) : 0,
          carbs_g: manualForm.carbs_g.trim() ? Number(manualForm.carbs_g) : 0,
          fat_g: manualForm.fat_g.trim() ? Number(manualForm.fat_g) : 0,
          fiber_g: manualForm.fiber_g.trim() ? Number(manualForm.fiber_g) : 0,
        },
      };

      const response = await fetch(API_ENDPOINTS.LOG_MEAL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!result.success) throw new Error(result.error || 'Save failed');

      setManualForm({ food_name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', fiber_g: '' });
      setManualModalVisible(false);
      fetchTodayLogs();
    } catch (e: any) {
      Alert.alert('Error', 'Failed to save entry.');
    } finally {
      setManualSaving(false);
    }
  };

  const handleGalleryPick = async () => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });

      if (pickerResult.canceled || !pickerResult.assets?.[0]) {
        return;
      }

      setSelectedAsset(pickerResult.assets[0]);
      setGalleryText('');
      setGalleryModalVisible(true);
    } catch (e: any) {
      Alert.alert('Error', 'Something went wrong picking the image.');
    }
  };

  const confirmGalleryAnalysis = async () => {
    if (!selectedAsset) return;
    
    setGalleryModalVisible(false);
    setLoading(true);
    setAnalysisStep(0);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Auth Error', 'You must be logged in.');
        setLoading(false);
        return;
      }

      const stepTimer = setInterval(() => {
        setAnalysisStep(prev => (prev < 2 ? prev + 1 : prev));
      }, 1500);

      const response = await fetch(API_ENDPOINTS.ANALYZE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          imageBase64: selectedAsset.base64,
          mimeType: 'image/jpeg',
          textQuery: galleryText.trim() || undefined,
        }),
      });
      
      clearInterval(stepTimer);
      const result = await response.json();

      if (result.success && result.log) {
        setAnalysisStep(2);
        setTimeout(() => {
          router.push({
            pathname: '/result',
            params: { data: JSON.stringify(result.log) },
          });
          setGalleryText('');
          setSelectedAsset(null);
          setLoading(false);
        }, 500);
      } else {
        setLoading(false);
        Alert.alert('Analysis Failed', result.error || 'Could not analyze the image.');
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', 'Something went wrong analyzing the image.');
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
    <>
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>NutriSnap</Text>
        </View>

        {/* Today's Intaker Card */}
        <View style={{ marginHorizontal: 20, backgroundColor: colors.card, borderRadius: 20, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14 }}>Today's Intake</Text>
          <CalorieRing current={dailyData.calories} target={dailyData.target} colors={colors} />
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6 }}>Target: {dailyData.target.toLocaleString()}</Text>
        </View>

        {/* Macro Layout */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginBottom: 16, gap: 10 }}>
          <MacroStat label="Protein" value={dailyData.protein.value} unit="g" color="#22C55E" themeColors={colors} />
          <MacroStat label="Carbs" value={dailyData.carbs.value} unit="g" color="#3B82F6" themeColors={colors} />
          <MacroStat label="Fats" value={dailyData.fat.value} unit="g" color="#F97316" themeColors={colors} />
        </View>
        {/* Detailed Micronutrients */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setMicroModalVisible(true)}
          style={{
            marginHorizontal: 20,
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            marginBottom: 16,
            padding: 13,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <Leaf size={18} color="#8B5CF6" />
          <Text style={{ color: '#8B5CF6', fontSize: 14, fontWeight: '800' }}>Detailed Micronutrients</Text>
        </TouchableOpacity>

        {/* Logging Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
            <View style={{
              flex: 1, backgroundColor: colors.card, borderRadius: 18, 
              paddingHorizontal: 16, paddingVertical: 8,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              borderWidth: 1, borderColor: colors.cardBorder,
            }}>
              <TextInput 
                placeholder="Log food manually..."
                placeholderTextColor={colors.textMuted}
                value={textQuery}
                onChangeText={setTextQuery}
                editable={!loading}
                style={{ flex: 1, color: colors.text, fontSize: 14, fontWeight: '600', paddingVertical: 6 }}
                onSubmitEditing={handleManualLog}
              />
              <TouchableOpacity 
                onPress={handleManualLog}
                disabled={loading}
                style={{
                width: 34, height: 34, borderRadius: 10, backgroundColor: colors.accent, 
                alignItems: 'center', justifyContent: 'center'
              }}>
                {loading ? <ActivityIndicator color={colors.background} /> : <Send size={16} color={colors.background} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Log Calories Button */}
          <TouchableOpacity
            onPress={() => setManualModalVisible(true)}
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingVertical: 13,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              marginBottom: 12,
            }}
          >
            <Plus size={18} color="#818CF8" />
            <Text style={{ color: '#818CF8', fontSize: 14, fontWeight: '800' }}>Log Calories</Text>
          </TouchableOpacity>

          {/* Snap Food / Gallery Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push('/scanner')}
              style={{
                flex: 1,
                backgroundColor: colors.accent,
                borderRadius: 16,
                paddingVertical: 13,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Camera size={18} color={colors.background} />
              <Text style={{ color: colors.background, fontSize: 14, fontWeight: '800' }}>Snap Food</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleGalleryPick}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: colors.card,
                borderRadius: 16,
                paddingVertical: 13,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: colors.cardBorder,
              }}
            >
              <ImageIcon size={18} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '800' }}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Meals */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Recent Meals</Text>
            <TouchableOpacity onPress={() => router.push('/history')}>
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>See History</Text>
            </TouchableOpacity>
          </View>
          {meals.map((meal) => (
            <MealCard key={meal.id} {...meal} onDelete={handleDeleteMeal} themeColors={colors} />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
    </GestureHandlerRootView>

    {/* Manual Calorie Log Modal */}
    <Modal
      visible={manualModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setManualModalVisible(false)}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setManualModalVisible(false)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={{
              backgroundColor: colors.card,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              paddingTop: 12,
              paddingBottom: 40,
              paddingHorizontal: 24,
            }}>
              {/* Handle Bar */}
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder }} />
              </View>

              {/* Title Row */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Log Calories</Text>
                <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                  <X size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Food Name */}
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>FOOD NAME *</Text>
              <TextInput
                placeholder="e.g. Grilled Chicken"
                placeholderTextColor={colors.textMuted}
                value={manualForm.food_name}
                onChangeText={(v) => setManualForm(p => ({ ...p, food_name: v }))}
                style={{
                  backgroundColor: colors.background, borderRadius: 14, padding: 14, color: colors.text,
                  fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16,
                }}
              />

              {/* Calories */}
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>CALORIES (KCAL) *</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={manualForm.calories}
                onChangeText={(v) => setManualForm(p => ({ ...p, calories: v }))}
                style={{
                  backgroundColor: colors.background, borderRadius: 14, padding: 14, color: colors.text,
                  fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16,
                }}
              />

              {/* Macros Row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>PROTEIN (g)</Text>
                  <TextInput
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={manualForm.protein_g}
                    onChangeText={(v) => setManualForm(p => ({ ...p, protein_g: v }))}
                    style={{
                      backgroundColor: colors.background, borderRadius: 14, padding: 14, color: colors.text,
                      fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: colors.cardBorder,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#3B82F6', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>CARBS (g)</Text>
                  <TextInput
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={manualForm.carbs_g}
                    onChangeText={(v) => setManualForm(p => ({ ...p, carbs_g: v }))}
                    style={{
                      backgroundColor: colors.background, borderRadius: 14, padding: 14, color: colors.text,
                      fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: colors.cardBorder,
                    }}
                  />
                </View>
              </View>

              {/* Fats & Fiber Row */}
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#F97316', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>FATS (g)</Text>
                  <TextInput
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={manualForm.fat_g}
                    onChangeText={(v) => setManualForm(p => ({ ...p, fat_g: v }))}
                    style={{
                      backgroundColor: colors.background, borderRadius: 14, padding: 14, color: colors.text,
                      fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: colors.cardBorder,
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#8B5CF6', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>FIBER (g)</Text>
                  <TextInput
                    placeholder="—"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={manualForm.fiber_g}
                    onChangeText={(v) => setManualForm(p => ({ ...p, fiber_g: v }))}
                    style={{
                      backgroundColor: colors.background, borderRadius: 14, padding: 14, color: colors.text,
                      fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: colors.cardBorder,
                    }}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                onPress={handleManualCalorieLog}
                disabled={manualSaving}
                style={{
                  backgroundColor: manualSaving ? '#818CF880' : '#818CF8',
                  borderRadius: 20,
                  paddingVertical: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                {manualSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>Save Entry</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>

    {/* Micronutrients Bottom Sheet Modal */}
    <Modal
      visible={microModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setMicroModalVisible(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setMicroModalVisible(false)}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
      >
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 12,
            paddingBottom: 40,
            paddingHorizontal: 24,
          }}>
            {/* Handle Bar */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.cardBorder }} />
            </View>

            {/* Title Row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Leaf size={20} color="#8B5CF6" />
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Micronutrients</Text>
              </View>
              <TouchableOpacity onPress={() => setMicroModalVisible(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Subtitle */}
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>TODAY'S TOTAL</Text>

            {/* Dietary Fiber */}
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              backgroundColor: colors.background, borderRadius: 16, padding: 18,
              borderWidth: 1, borderColor: colors.surface,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 12,
                  backgroundColor: '#8B5CF615', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Leaf size={16} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>Dietary Fiber</Text>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 }}>Recommended: 25–30g/day</Text>
                </View>
              </View>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>
                {dailyData.fiber}<Text style={{ fontSize: 13, color: colors.textSecondary, fontWeight: '700' }}>g</Text>
              </Text>
            </View>

          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>

    {/* Gallery Pick Confirmation Modal */}
    <Modal
      visible={galleryModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setGalleryModalVisible(false)}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: colors.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingTop: 24,
            paddingBottom: 40,
            paddingHorizontal: 24,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>Review Photo</Text>
              <TouchableOpacity onPress={() => setGalleryModalVisible(false)}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedAsset && (
              <View style={{ 
                width: '100%', height: 200, borderRadius: 20, 
                overflow: 'hidden', marginBottom: 20,
                borderWidth: 1, borderColor: colors.cardBorder 
              }}>
                <Image source={{ uri: selectedAsset.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
              </View>
            )}

            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>ANYTHING ELSE? (OPTIONAL)</Text>
            <TextInput
              placeholder="e.g. 2 pieces aloo, no sauce..."
              placeholderTextColor={colors.textMuted}
              value={galleryText}
              onChangeText={setGalleryText}
              style={{
                backgroundColor: colors.background, borderRadius: 16, padding: 16, color: colors.text,
                fontSize: 15, fontWeight: '600', borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 24,
              }}
            />

            <TouchableOpacity
              onPress={confirmGalleryAnalysis}
              style={{
                backgroundColor: colors.accent,
                borderRadius: 20,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: colors.background, fontSize: 16, fontWeight: '800' }}>Start Analysis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    {/* Full Screen Loading Overlay */}
    <Modal visible={loading} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 18, 0.95)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 24, textAlign: 'center' }}>
          Analyzing Food
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600', marginTop: 8, textAlign: 'center' }}>
          {analysisSteps[analysisStep]}
        </Text>
        
        {/* Progress Bar */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 32 }}>
          {analysisSteps.map((_, i) => (
            <View
              key={i}
              style={{
                width: i <= analysisStep ? 30 : 10,
                height: 4,
                borderRadius: 2,
                backgroundColor: i <= analysisStep ? colors.accent : colors.cardBorder,
              }}
            />
          ))}
        </View>

        <View style={{ position: 'absolute', bottom: 60 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
            Powered by Gemini AI
          </Text>
        </View>
      </View>
    </Modal>

    </>
  );
}
