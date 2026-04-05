import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Settings, ChevronRight, LogOut, Moon, Target, UserCircle, Mail, Key } from 'lucide-react-native';
import { useUserContext } from '../../context/UserContext';
import { supabase } from '../../lib/supabase';

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#141420', borderRadius: 18, padding: 16,
      borderWidth: 1, borderColor: '#252540', alignItems: 'center',
    }}>
      <Text style={{ color: '#555570', fontSize: 10, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{label}</Text>
      <Text style={{ color: '#EEEEF0', fontSize: 24, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: '#555570', fontSize: 11, marginTop: 2 }}>{sub}</Text>
    </View>
  );
}

function SettingsRow({ icon, label, value, onPress }: { icon: React.ReactNode; label: string; value?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{
      flexDirection: 'row', alignItems: 'center', paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
    }}>
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
        {icon}
      </View>
      <Text style={{ flex: 1, color: '#EEEEF0', fontSize: 15, fontWeight: '600' }}>{label}</Text>
      {value && <Text style={{ color: '#555570', fontSize: 13, marginRight: 8 }}>{value}</Text>}
      <ChevronRight size={16} color="#555570" />
    </TouchableOpacity>
  );
}

export default function Profile() {
  const { dailyGoal, setDailyGoal } = useUserContext();
  
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B12', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#00D4AA" />
      </SafeAreaView>
    );
  }

  // --- Auth & Onboarding Views ---
  if (authStage === 'LOGIN' || authStage === 'OTP') {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B12', justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
             <Text style={{ fontSize: 48, marginBottom: 16 }}>🥗</Text>
             <Text style={{ color: '#EEEEF0', fontSize: 24, fontWeight: '800', letterSpacing: 1 }}>NutriSnap</Text>
             <Text style={{ color: '#8888A0', fontSize: 15, marginTop: 8, textAlign: 'center' }}>
               {authStage === 'LOGIN' ? 'Sign in to track your macros seamlessly.' : `We sent a code to ${email}`}
             </Text>
          </View>

          {authStage === 'LOGIN' ? (
            <View style={{ backgroundColor: '#141420', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: '#252540' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                <Mail size={20} color="#555570" />
                <TextInput 
                  placeholder="Enter your email" placeholderTextColor="#555570"
                  style={{ flex: 1, color: '#EEEEF0', fontSize: 16, marginLeft: 12, paddingVertical: 4 }}
                  value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
                />
              </View>
              <TouchableOpacity onPress={handleSendOtp} disabled={loading} style={{ backgroundColor: '#00D4AA', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 }}>
                {loading ? <ActivityIndicator color="#0B0B12" /> : <Text style={{ color: '#0B0B12', fontSize: 16, fontWeight: '800' }}>Send Code</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ backgroundColor: '#141420', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: '#252540' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
                <Key size={20} color="#555570" />
                <TextInput 
                  placeholder="Enter login code" placeholderTextColor="#555570"
                  style={{ flex: 1, color: '#EEEEF0', fontSize: 16, marginLeft: 12, paddingVertical: 4 }}
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
              <Text style={{ color: '#8888A0', fontSize: 14, fontWeight: '600' }}>
                Wrong email? <Text style={{ color: '#00D4AA', fontWeight: '800' }}>Go back</Text>
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B12', justifyContent: 'center', padding: 24 }}>
          <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Account Confirmed</Text>
          <Text style={{ color: '#EEEEF0', fontSize: 32, fontWeight: '800', marginBottom: 40 }}>Let's set up your profile.</Text>

          <Text style={{ color: '#8888A0', fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>FULL NAME</Text>
          <View style={{ backgroundColor: '#141420', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: '#252540', marginBottom: 24 }}>
             <TextInput 
               placeholder="John Doe" placeholderTextColor="#555570"
               style={{ color: '#EEEEF0', fontSize: 18, fontWeight: '600' }}
               value={fullName} onChangeText={setFullName}
             />
          </View>

          <Text style={{ color: '#8888A0', fontSize: 14, fontWeight: '600', marginBottom: 8, marginLeft: 4 }}>DAILY CALORIE GOAL</Text>
          <View style={{ backgroundColor: '#141420', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: 1, borderColor: '#252540', marginBottom: 40 }}>
             <TextInput 
               keyboardType="numeric"
               style={{ color: '#00D4AA', fontSize: 24, fontWeight: '800' }}
               value={goalInput} onChangeText={setGoalInput}
             />
          </View>

          <TouchableOpacity onPress={handleCompleteOnboarding} disabled={loading} style={{ backgroundColor: '#00D4AA', borderRadius: 16, paddingVertical: 18, alignItems: 'center' }}>
            {loading ? <ActivityIndicator color="#0B0B12" /> : <Text style={{ color: '#0B0B12', fontSize: 16, fontWeight: '800' }}>Complete Setup</Text>}
          </TouchableOpacity>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    );
  }

  // --- Main Authenticated Profile View ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B12' }}>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text style={{ color: '#EEEEF0', fontSize: 18, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>Profile</Text>
          <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#141420', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#252540' }}>
            <Settings size={18} color="#8888A0" />
          </TouchableOpacity>
        </View>

        {/* Avatar & Name */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View style={{
            width: 88, height: 88, borderRadius: 44,
            backgroundColor: '#141420', alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: '#00D4AA',
            marginBottom: 14,
          }}>
            <Text style={{ fontSize: 36 }}>👤</Text>
          </View>
          <Text style={{ color: '#EEEEF0', fontSize: 22, fontWeight: '800' }}>{profile?.full_name || 'Member'}</Text>
          <Text style={{ color: '#555570', fontSize: 13, marginTop: 4 }}>{session?.user?.email}</Text>
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 28 }}>
          <StatCard label="Streak" value="14" sub="days" />
          <StatCard label="Logged" value="247" sub="meals" />
          <StatCard label="Avg" value="2.1K" sub="kcal/day" />
        </View>

        {/* Settings */}
        <View style={{ paddingHorizontal: 20, marginBottom: 40 }}>
          <Text style={{ color: '#555570', fontSize: 11, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Settings</Text>
          <View style={{ backgroundColor: '#141420', borderRadius: 20, paddingHorizontal: 16, borderWidth: 1, borderColor: '#252540' }}>
            <SettingsRow 
              icon={<Target size={18} color="#00D4AA" />} 
              label="Daily Goals" 
              value={`${dailyGoal.toLocaleString()} kcal`} 
              onPress={() => {
                setTempGoal(dailyGoal.toString());
                setModalVisible(true);
              }}
            />
            <SettingsRow icon={<Moon size={18} color="#818CF8" />} label="Appearance" value="Dark" />
            <SettingsRow icon={<UserCircle size={18} color="#3B82F6" />} label="Account" />
            <SettingsRow icon={<Bell size={18} color="#F59E0B" />} label="Notifications" />
          </View>

          <TouchableOpacity onPress={handleSignOut} style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            marginTop: 28, backgroundColor: '#1A0A0A', borderRadius: 16,
            paddingVertical: 16, gap: 8,
            borderWidth: 1, borderColor: '#3A1515',
          }}>
            <LogOut size={18} color="#EF4444" />
            <Text style={{ color: '#EF4444', fontSize: 15, fontWeight: '700' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Daily Goal Update Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={{ flex: 1, backgroundColor: 'rgba(11, 11, 18, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <View style={{ backgroundColor: '#141420', borderRadius: 24, padding: 24, width: '100%', borderWidth: 1, borderColor: '#252540' }}>
              <Text style={{ color: '#EEEEF0', fontSize: 20, fontWeight: '800', marginBottom: 16, textAlign: 'center' }}>Set Daily Goal</Text>
              
              <View style={{
                backgroundColor: '#1A1A2E', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
                borderWidth: 1, borderColor: '#00D4AA50', marginBottom: 24, flexDirection: 'row', alignItems: 'center'
              }}>
                <TextInput 
                  style={{ flex: 1, color: '#00D4AA', fontSize: 24, fontWeight: '800', textAlign: 'center' }}
                  keyboardType="numeric"
                  value={tempGoal}
                  onChangeText={setTempGoal}
                  autoFocus
                />
                <Text style={{ color: '#555570', fontSize: 16, fontWeight: '700', marginLeft: 8 }}>KCAL</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#1A1A2E' }}
                >
                  <Text style={{ color: '#EEEEF0', fontWeight: '700', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleSaveGoal}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: '#00D4AA' }}
                >
                  <Text style={{ color: '#0B0B12', fontWeight: '800', fontSize: 16 }}>Save Goal</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </SafeAreaView>
  );
}
