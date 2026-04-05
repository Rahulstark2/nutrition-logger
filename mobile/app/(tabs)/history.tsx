import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Search, SlidersHorizontal } from 'lucide-react-native';

// --- Macro Bar Component ---
function MacroBar({ protein, carbs, fat, total }: { protein: number; carbs: number; fat: number; total: number }) {
  const pW = (protein / total) * 100;
  const cW = (carbs / total) * 100;
  const fW = (fat / total) * 100;
  return (
    <View style={{ flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 10, marginBottom: 6 }}>
      <View style={{ width: `${pW}%` as any, backgroundColor: '#22C55E', borderRadius: 2 }} />
      <View style={{ width: `${cW}%` as any, backgroundColor: '#3B82F6', borderRadius: 2, marginLeft: 2 }} />
      <View style={{ width: `${fW}%` as any, backgroundColor: '#F97316', borderRadius: 2, marginLeft: 2 }} />
    </View>
  );
}

// --- History Meal Card ---
function HistoryMealCard({ name, mealType, time, calories, protein, carbs, fat }: {
  name: string; mealType: string; time: string; calories: number;
  protein: number; carbs: number; fat: number;
}) {
  const total = protein + carbs + fat;
  return (
    <View style={{
      backgroundColor: '#141420', borderRadius: 20, padding: 16,
      marginBottom: 12, borderWidth: 1, borderColor: '#252540',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center',
          marginRight: 14,
        }}>
          <Text style={{ fontSize: 24 }}>🍽️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#EEEEF0', fontSize: 16, fontWeight: '700' }}>{name}</Text>
          <Text style={{ color: '#555570', fontSize: 12, marginTop: 2 }}>{mealType} • {time}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: '#EEEEF0', fontSize: 22, fontWeight: '800' }}>{calories}</Text>
          <Text style={{ color: '#555570', fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>kcal</Text>
        </View>
      </View>
      <MacroBar protein={protein} carbs={carbs} fat={fat} total={total} />
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 2 }}>
        <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{protein}G PROT</Text>
        <Text style={{ color: '#3B82F6', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{carbs}G CARB</Text>
        <Text style={{ color: '#F97316', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{fat}G FAT</Text>
      </View>
    </View>
  );
}

// --- Weekly Bar Chart (simplified) ---
function WeeklyBars() {
  const bars = [65, 80, 50, 90, 70, 85, 40];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 40 }}>
      {bars.map((h, i) => (
        <View key={i} style={{
          width: 4, height: `${h}%` as any, borderRadius: 2,
          backgroundColor: i === bars.length - 1 ? '#3B82F6' : '#555570',
        }} />
      ))}
    </View>
  );
}

export default function History() {
  const todayMeals = [
    { id: '1', name: 'Wild Salmon Bowl', mealType: 'Lunch', time: '12:45 PM', calories: 540, protein: 45, carbs: 28, fat: 12 },
    { id: '2', name: 'Sourdough & Avocado', mealType: 'Breakfast', time: '08:30 AM', calories: 320, protein: 12, carbs: 48, fat: 18 },
  ];
  const yesterdayMeals = [
    { id: '3', name: 'Grass-fed Ribeye', mealType: 'Dinner', time: '07:15 PM', calories: 820, protein: 62, carbs: 8, fat: 42 },
    { id: '4', name: 'Superfood Quinoa Salad', mealType: 'Lunch', time: '01:00 PM', calories: 410, protein: 18, carbs: 55, fat: 14 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B12' }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#252540' }}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
            </View>
            <Text style={{ color: '#EEEEF0', fontSize: 18, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>NutriSnap</Text>
          </View>
          <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#141420', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#252540' }}>
            <Bell size={18} color="#8888A0" />
          </TouchableOpacity>
        </View>

        {/* Weekly Performance */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ color: '#555570', fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}>Weekly Performance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <Text style={{ color: '#EEEEF0', fontSize: 36, fontWeight: '800' }}>2,140</Text>
                <Text style={{ color: '#555570', fontSize: 14, fontWeight: '600', letterSpacing: 1 }}>AVG KCAL</Text>
              </View>
            </View>
            <WeeklyBars />
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24, flexDirection: 'row', gap: 12 }}>
          <View style={{
            flex: 1, backgroundColor: '#141420', borderRadius: 14,
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
            borderWidth: 1, borderColor: '#252540', height: 48,
          }}>
            <Search size={16} color="#555570" />
            <TextInput
              placeholder="Search logs..."
              placeholderTextColor="#555570"
              style={{ flex: 1, color: '#EEEEF0', marginLeft: 10, fontSize: 14 }}
            />
          </View>
          <TouchableOpacity style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: '#141420', alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: '#252540',
          }}>
            <SlidersHorizontal size={18} color="#8888A0" />
          </TouchableOpacity>
        </View>

        {/* Today */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#EEEEF0', fontSize: 20, fontWeight: '800' }}>Today</Text>
            <Text style={{ color: '#555570', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>1,840 KCAL</Text>
          </View>
          {todayMeals.map((m) => <HistoryMealCard key={m.id} {...m} />)}
        </View>

        {/* Yesterday */}
        <View style={{ paddingHorizontal: 20, marginTop: 10, marginBottom: 40 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: '#EEEEF0', fontSize: 20, fontWeight: '800' }}>Yesterday</Text>
            <Text style={{ color: '#555570', fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>2,410 KCAL</Text>
          </View>
          {yesterdayMeals.map((m) => <HistoryMealCard key={m.id} {...m} />)}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
