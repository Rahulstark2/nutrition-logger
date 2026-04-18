import { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useUserContext } from '../../context/UserContext';
import { supabase } from '../../lib/supabase';
import { router, useFocusEffect } from 'expo-router';

// --- Macro Bar Component ---
function MacroBar({ protein, carbs, fat, total }: { protein: number; carbs: number; fat: number; total: number }) {
  if (total === 0) return null;
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
function HistoryMealCard({ name, time, calories, protein, carbs, fat, fiber, colors }: {
  name: string; time: string; calories: number;
  protein: number; carbs: number; fat: number; fiber: number; colors: any;
}) {
  const total = protein + carbs + fat;
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => {
        const logData = {
          food_name: name,
          calories: calories,
          protein_g: protein,
          carbs_g: carbs,
          fat_g: fat,
          fiber_g: fiber,
        };
        router.push({
          pathname: '/result',
          params: { data: JSON.stringify(logData), isViewOnly: 'true' }
        });
      }}
      style={{
        backgroundColor: colors.card, borderRadius: 20, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: colors.cardBorder,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
          marginRight: 14,
        }}>
          <Text style={{ fontSize: 24 }}>🍽️</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>{name}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{time}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{Math.round(calories)}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1 }}>kcal</Text>
        </View>
      </View>
      <MacroBar protein={protein} carbs={carbs} fat={fat} total={total} />
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 2 }}>
        <Text style={{ color: '#22C55E', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{protein}G PROT</Text>
        <Text style={{ color: '#3B82F6', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{carbs}G CARB</Text>
        <Text style={{ color: '#F97316', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{fat}G FAT</Text>
      </View>
    </TouchableOpacity>
  );
}

// --- Weekly Bar Chart (simplified) ---
function WeeklyBars({ stats, colors }: { stats: number[], colors: any }) {
  const max = Math.max(...stats, 2500);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 40 }}>
      {stats.map((val, i) => (
        <View key={i} style={{
          width: 6, height: `${Math.max(10, (val / max) * 100)}%` as any, borderRadius: 3,
          backgroundColor: i === stats.length - 1 ? '#3B82F6' : colors.textMuted + '40',
        }} />
      ))}
    </View>
  );
}

export default function History() {
  const { colors } = useUserContext();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLogs(data);
    } catch (err) {
      console.log('Error fetching history logs', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLogs();
    }, [])
  );

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const filtered = logs.filter(log => 
      log.food_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: { [title: string]: { meals: any[], totalKcal: number } } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    filtered.forEach(log => {
      const date = new Date(log.created_at);
      const dateStr = date.toDateString();
      let title = dateStr;

      if (dateStr === todayStr) title = 'Today';
      else if (dateStr === yesterdayStr) title = 'Yesterday';
      else title = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

      if (!groups[title]) {
        groups[title] = { meals: [], totalKcal: 0 };
      }
      
      groups[title].meals.push({
        id: log.id,
        name: log.food_name || 'Manual Log',
        time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        calories: Number(log.calories) || 0,
        protein: Number(log.protein_g) || 0,
        carbs: Number(log.carbs_g) || 0,
        fat: Number(log.fat_g) || 0,
        fiber: Number(log.fiber_g) || 0,
      });
      groups[title].totalKcal += Number(log.calories) || 0;
    });

    return Object.entries(groups);
  }, [logs, searchQuery]);

  // Weekly Stats (last 7 days total calories)
  const weeklyStats = useMemo(() => {
    const stats = new Array(7).fill(0);
    const now = new Date();
    
    logs.forEach(log => {
      const date = new Date(log.created_at);
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        stats[6 - diffDays] += Number(log.calories) || 0;
      }
    });
    return stats;
  }, [logs]);

  const avgKcal = weeklyStats.reduce((a, b) => a + b, 0) / 7;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder }}>
              <Text style={{ fontSize: 18 }}>📅</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Log History</Text>
          </View>
          <View style={{ width: 40, height: 40 }} />
        </View>

        {/* Weekly Performance */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase' }}>Weekly Performance</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <Text style={{ color: colors.text, fontSize: 36, fontWeight: '800' }}>{Math.round(avgKcal).toLocaleString()}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '600', letterSpacing: 1 }}>AVG KCAL</Text>
              </View>
            </View>
            <WeeklyBars stats={weeklyStats} colors={colors} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24, flexDirection: 'row', gap: 12 }}>
          <View style={{
            flex: 1, backgroundColor: colors.card, borderRadius: 14,
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
            borderWidth: 1, borderColor: colors.cardBorder, height: 48,
          }}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search logs..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ flex: 1, color: colors.text, marginLeft: 10, fontSize: 14 }}
            />
          </View>
          {/* Filter icon removed */}
        </View>

        {loading ? (
          <View style={{ marginTop: 40 }}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : groupedLogs.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: '600' }}>No logs found.</Text>
          </View>
        ) : (
          groupedLogs.map(([title, data]) => (
            <View key={title} style={{ paddingHorizontal: 20, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{title}</Text>
                <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', letterSpacing: 1 }}>{Math.round(data.totalKcal).toLocaleString()} KCAL</Text>
              </View>
              {data.meals.map((m) => (
                <HistoryMealCard key={m.id} {...m} colors={colors} />
              ))}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
}
