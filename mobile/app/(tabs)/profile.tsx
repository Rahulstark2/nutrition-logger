import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Settings, ChevronRight, LogOut, Moon, Target, UserCircle, Mail, Key } from 'lucide-react-native';
import { useUserContext } from '../../context/UserContext';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from 'expo-router';
import type { ThemeColors } from '../../constants/colors';

function StatCard({ label, value, sub, colors }: { label: string; value: string; sub: string; colors: ThemeColors }) {
  return (
    <View style={{
      flex: 1, backgroundColor: colors.card, borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center',
    }}>
      <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>{sub}</Text>
    </View>
  );
}

function SettingsRow({ icon, label, value, onPress, colors }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void; colors: ThemeColors }) {
  return (
    <TouchableOpacity onPress={onPress} style={{
      flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: colors.surface,
    }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        {icon}
      </View>
      <Text style={{ flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' }}>{label}</Text>
      {value && <Text style={{ color: colors.textMuted, fontSize: 13, marginRight: 8 }}>{value}</Text>}
      <ChevronRight size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function Profile() {
  const { dailyGoal, setDailyGoal, colors, themeMode, setThemeMode } = useUserContext();
  
  // Auth & UI States
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null); // from public.users table
  const [authStage, setAuthStage] = useState<'LOGIN' | 'OTP' | 'ONBOARDING' | 'PROFILE'>('LOGIN');
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [goalInput, setGoalInput] = useState('2200');
  
  // Modal State for profile editing later
  const [modalVisible, setModalVisible] = useState(false);
  const [tempGoal, setTempGoal] = useState("");

  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);

  // Stats States
  const [streak, setStreak] = useState(0);
  const [loggedMeals, setLoggedMeals] = useState(0);
  const [avgKcal, setAvgKcal] = useState('0');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setSession(session);
      await fetchOrRequireProfile(session.user.id, false);
    } else {
      setAuthStage('LOGIN');
      setLoading(false);
    }
  };

  const fetchOrRequireProfile = async (userId: string, isJustVerified: boolean = false) => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      setDailyGoal(data.daily_goal || 2200);
      setAuthStage('PROFILE');
    } else {
      if (isJustVerified) {
        // Just typed OTP right now in this exact session
        setAuthStage('ONBOARDING');
      } else {
        // App restarted and found a halfway-abandoned profile. Nuke it!
        await supabase.auth.signOut();
        setSession(null);
        setAuthStage('LOGIN');
      }
    }
    setLoading(false);
  };

  const fetchStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('created_at, calories')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return;

      setLoggedMeals(data.length);

      if (data.length === 0) {
        setStreak(0);
        setAvgKcal('0');
        return;
      }

      // Calculate streak
      const uniqueDates = new Set(
        data.map(log => {
          const d = new Date(log.created_at);
          return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        })
      );
      
      const sortedDates = Array.from(uniqueDates).sort((a, b) => {
        const [yA, mA, dA] = a.split('-').map(Number);
        const [yB, mB, dB] = b.split('-').map(Number);
        return new Date(yB, mB, dB).getTime() - new Date(yA, mA, dA).getTime();
      });
      
      let currentStreak = 0;
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = `${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`;

      // If the latest log is not today and not yesterday, streak broken
      if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
        currentStreak = 0;
      } else {
        // Count backwards
        let curr = sortedDates[0] === todayStr ? today : yesterday;
        for (let i = 0; i < sortedDates.length; i++) {
          const dStr = `${curr.getFullYear()}-${curr.getMonth()}-${curr.getDate()}`;
          if (sortedDates.includes(dStr)) {
            currentStreak++;
            curr.setDate(curr.getDate() - 1);
          } else {
            break;
          }
        }
      }
      setStreak(currentStreak);

      // Calculate Avg Kcal
      const totalCalories = data.reduce((sum, log) => sum + (Number(log.calories) || 0), 0);
      const avg = totalCalories / uniqueDates.size;
      setAvgKcal(avg > 1000 ? (avg / 1000).toFixed(1) + 'K' : Math.round(avg).toString());
    } catch (e) {
      console.log("Error fetching stats:", e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (session?.user?.id) {
        fetchStats(session.user.id);
      }
    }, [session])
  );

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) return Alert.alert('Invalid Email');
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else setAuthStage('OTP');
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 5) return;
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
    if (error) {
      setLoading(false);
      return Alert.alert('Error', error.message);
    }
    if (data.session) {
      setSession(data.session);
      await fetchOrRequireProfile(data.session.user.id, true);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!fullName.trim() || !session?.user) return Alert.alert('Enter Full Name');
    setLoading(true);
    const numericGoal = parseInt(goalInput) || 2200;
    
    // Insert into public.users
    const { error } = await supabase.from('users').insert({
      id: session.user.id, // we tie public profile to auth ID
      email: session.user.email,
      full_name: fullName,
      daily_goal: numericGoal
    });
    
    if (error) {
       Alert.alert('Error saving profile', error.message);
       setLoading(false);
    } else {
       await fetchOrRequireProfile(session.user.id, false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setAuthStage('LOGIN');
  };

  const handleSaveGoal = () => {
    if (tempGoal.trim()) {
      const parsed = Number(tempGoal.replace(/\D/g, ''));
      if (parsed > 0) {
        setDailyGoal(parsed);
        // Also update backend async silently
        if (session) supabase.from('users').update({ daily_goal: parsed }).eq('id', session.user.id).then();
      }
    }
    setModalVisible(false);
  };

  if (loading && authStage !== 'PROFILE') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  // --- Auth & Onboarding Views ---
  if (authStage === 'LOGIN' || authStage === 'OTP') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
             <Text style={{ fontSize: 48, marginBottom: 16 }}>🥗</Text>
             <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: 1 }}>NutriSnap</Text>
             <Text style={{ color: colors.textSecondary, fontSize: 15, marginTop: 8, textAlign: 'center' }}>
               {authStage === 'LOGIN' ? 'Sign in to track your macros seamlessly.' : `We sent a code to ${email}`}
             </Text>
          </View>

          {authStage === 'LOGIN' ? (
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: colors.cardBorder }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                <Mail size={20} color={colors.textMuted} />
                <TextInput 
                  placeholder="Enter your email" placeholderTextColor={colors.textMuted}
                  style={{ flex: 1, color: colors.text, fontSize: 16, marginLeft: 12, paddingVertical: 4 }}
                  value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
                />
              </View>
              <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={{ backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}>
                {loading ? <ActivityIndicator color={colors.background} /> : <Text style={{ color: colors.background, fontSize: 16, fontWeight: '800' }}>Send Code</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.card, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: colors.cardBorder }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                <Key size={20} color={colors.textMuted} />
                <TextInput 
                  placeholder="Enter login code" placeholderTextColor={colors.textMuted}
                  style={{ flex: 1, color: colors.text, fontSize: 16, marginLeft: 12, paddingVertical: 4 }}
                  value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={10}
                />
              </View>
              <TouchableOpacity onPress={handleVerifyOtp} disabled={loading} style={{ backgroundColor: '#3B82F6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}>
                 {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>Verify Code</Text>}
              </TouchableOpacity>
            </View>
          )}

          {authStage === 'OTP' && (
            <TouchableOpacity 
              onPress={() => setAuthStage('LOGIN')} 
              disabled={loading} 
              style={{ marginTop: 24, alignItems: 'center', paddingVertical: 12 }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600' }}>
                Wrong email? <Text style={{ color: colors.accent, fontWeight: '800' }}>Go back</Text>
              </Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  if (authStage === 'ONBOARDING') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Account Confirmed</Text>
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: '800', marginBottom: 40 }}>Let's set up your profile.</Text>

          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>FULL NAME</Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 24 }}>
             <TextInput 
               placeholder="John Doe" placeholderTextColor={colors.textMuted}
               style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}
               value={fullName} onChangeText={setFullName}
             />
          </View>

          <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>DAILY CALORIE GOAL</Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 40 }}>
             <TextInput 
               keyboardType="numeric"
               style={{ color: colors.accent, fontSize: 24, fontWeight: '800' }}
               value={goalInput} onChangeText={setGoalInput}
             />
          </View>

          <TouchableOpacity onPress={handleCompleteOnboarding} disabled={loading} style={{ backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}>
            {loading ? <ActivityIndicator color={colors.background} /> : <Text style={{ color: colors.background, fontSize: 16, fontWeight: '800' }}>Complete Setup</Text>}
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  // --- Main Authenticated Profile View ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Profile</Text>
        </View>

        {/* Avatar & Name */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{
            width: 88, height: 88, borderRadius: 44,
            backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: colors.accent,
            marginBottom: 14,
          }}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{profile?.full_name || 'Member'}</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>{session?.user?.email}</Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 28 }}>
          <StatCard label="Streak" value={streak.toString()} sub="days" colors={colors} />
          <StatCard label="Logged" value={loggedMeals.toString()} sub="meals" colors={colors} />
          <StatCard label="Avg" value={avgKcal} sub="kcal/day" colors={colors} />
        </View>

        {/* Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Settings</Text>
          <View style={{ backgroundColor: colors.card, borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.cardBorder }}>
            <SettingsRow 
              icon={<Target size={18} color={colors.accent} />} 
              label="Daily Goals" 
              value={`${dailyGoal.toLocaleString()} kcal`} 
              colors={colors}
              onPress={() => {
                setTempGoal(dailyGoal.toString());
                setModalVisible(true);
              }}
            />
            <SettingsRow icon={<Moon size={18} color="#818CF8" />} label="Appearance" value={themeMode} colors={colors} onPress={() => setAppearanceModalVisible(true)} />
          </View>

          <TouchableOpacity onPress={handleSignOut} style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            marginTop: 28, backgroundColor: colors.dangerBg, borderRadius: 16,
            paddingVertical: 16, gap: 8,
            borderWidth: 1, borderColor: colors.dangerBorder,
          }}>
            <LogOut size={18} color={colors.danger} />
            <Text style={{ color: colors.danger, fontSize: 15, fontWeight: '700' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Daily Goal Update Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: colors.cardBorder }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 16, textAlign: 'center' }}>Set Daily Goal</Text>
              
              <View style={{
                backgroundColor: colors.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
                borderWidth: 1, borderColor: colors.accent + '50', marginBottom: 24, flexDirection: 'row', alignItems: 'center'
              }}>
                <TextInput 
                  style={{ flex: 1, color: colors.accent, fontSize: 24, fontWeight: '800', textAlign: 'center' }}
                  keyboardType="numeric"
                  value={tempGoal}
                  onChangeText={setTempGoal}
                  autoFocus
                />
                <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>KCAL</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.surface }}
                >
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSaveGoal}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: colors.accent }}
                >
                  <Text style={{ color: colors.background, fontWeight: '800', fontSize: 16 }}>Save Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Appearance Selection Modal */}
      <Modal visible={appearanceModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setAppearanceModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: colors.cardBorder }}>
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 24, textAlign: 'center' }}>Appearance</Text>
              
              {(['System', 'Dark', 'Light'] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  onPress={() => {
                    console.log('Selected theme mode:', mode);
                    setThemeMode(mode);
                    setAppearanceModalVisible(false);
                  }}
                  style={{
                    backgroundColor: themeMode === mode ? colors.surface : 'transparent',
                    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 20,
                    marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    borderWidth: 1, borderColor: themeMode === mode ? colors.accent + '50' : 'transparent'
                  }}
                >
                  <Text style={{ color: themeMode === mode ? colors.accent : colors.text, fontSize: 16, fontWeight: '700' }}>{mode}</Text>
                  {themeMode === mode && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
                  )}
                </TouchableOpacity>
              ))}

            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}
