import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Bell, Zap, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useUserContext } from '../../context/UserContext';
import { API_ENDPOINTS } from '../../lib/apiConfig';

const { width, height } = Dimensions.get('window');

// --- Animated Analysis Dots ---
function AnalysisDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
    animate(dot1, 0).start();
    animate(dot2, 200).start();
    animate(dot3, 400).start();
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: '#00D4AA',
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
}

// --- Scanning Ring Animation ---
function ScanRing() {
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ transform: [{ rotate }, { scale: pulse }], marginBottom: 28 }}>
      <View style={{
        width: 100, height: 100, borderRadius: 50,
        borderWidth: 3, borderColor: '#00D4AA20',
        borderTopColor: '#00D4AA',
        borderRightColor: '#00D4AA80',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <View style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: '#141420',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: '#252540',
        }}>
          <Zap size={28} color="#00D4AA" />
        </View>
      </View>
    </Animated.View>
  );
}

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const { colors } = useUserContext();

  const analysisSteps = [
    'Capturing image...',
    'Identifying food items...',
    'Calculating nutrients...',
    'Finalizing results...',
  ];

  useEffect(() => {
    if (analyzing) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 40, friction: 7 }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(40);
    }
  }, [analyzing]);

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, borderWidth: 1, borderColor: colors.cardBorder,
        }}>
          <Zap size={32} color={colors.accent} />
        </View>
        <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>Camera Access Required</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
          Allow camera access to scan your food and get instant nutritional data.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{
            backgroundColor: colors.accent, borderRadius: 16,
            paddingVertical: 16, paddingHorizontal: 48,
          }}
        >
          <Text style={{ color: colors.background, fontSize: 16, fontWeight: '800' }}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const snapFood = async () => {
    if (!cameraRef) return;

    try {
      const picture = await cameraRef.takePictureAsync({ base64: true, quality: 0.5 });
      setCapturedUri(picture.uri);
      setAnalyzing(true);
      setAnalysisStep(0);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Auth Error', 'You must be logged in.');
        resetScanner();
        return;
      }

      // Start step rotation
      const stepTimer = setInterval(() => {
        setAnalysisStep(prev => (prev < 3 ? prev + 1 : prev));
      }, 1200);

      const response = await fetch(API_ENDPOINTS.ANALYZE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          imageBase64: picture.base64,
          mimeType: 'image/jpeg',
        }),
      });
      const result = await response.json();
      clearInterval(stepTimer);

      if (result.success && result.log) {
        setAnalysisStep(3);
        setTimeout(() => {
          router.push({
            pathname: '/result',
            params: { data: JSON.stringify(result.log) }
          });
          resetScanner();
        }, 500);
      } else {
        Alert.alert('Analysis Failed', 'Could not analyze image. Please try again.');
        resetScanner();
      }
    } catch (e: any) {
      console.log('Capture error:', e);
      resetScanner();
    }
  };

  const resetScanner = () => {
    setAnalyzing(false);
    setCapturedUri(null);
    setAnalysisStep(0);
  };

  if (analyzing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0B12' }}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
          {/* Top Header Placeholder */}
          <View style={{ position: 'absolute', top: 20 }}>
             <ActivityIndicator color="#00D4AA" size="small" />
          </View>

          {capturedUri && (
            <Animated.View style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              marginBottom: 32,
            }}>
              <View style={{
                width: 140, height: 140, borderRadius: 24,
                overflow: 'hidden',
                borderWidth: 2, borderColor: '#00D4AA40',
              }}>
                <Image
                  source={{ uri: capturedUri }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              {/* Glow effect */}
              <View style={{
                position: 'absolute', bottom: -8, left: 20, right: 20,
                height: 16, borderRadius: 8,
                backgroundColor: '#00D4AA15',
              }} />
            </Animated.View>
          )}

          {/* Scan Ring */}
          <ScanRing />

          {/* Analysis Step Text */}
          <Animated.View style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            alignItems: 'center',
          }}>
            <Text style={{
              color: '#EEEEF0', fontSize: 22, fontWeight: '800',
              letterSpacing: 0.5, marginBottom: 8,
            }}>
              Analyzing Food
            </Text>
            <Text style={{
              color: '#8888A0', fontSize: 14, fontWeight: '600',
              letterSpacing: 0.5,
            }}>
              {analysisSteps[analysisStep]}
            </Text>

            {/* Analysis Dots */}
            <AnalysisDots />

            {/* Progress Steps */}
            <View style={{
              flexDirection: 'row', gap: 6, marginTop: 28,
            }}>
              {analysisSteps.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i <= analysisStep ? 24 : 8,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i <= analysisStep ? '#00D4AA' : '#252540',
                  }}
                />
              ))}
            </View>
          </Animated.View>

          {/* Subtle branding */}
          <View style={{ position: 'absolute', bottom: 48 }}>
            <Text style={{
              color: '#333350', fontSize: 11, fontWeight: '700',
              letterSpacing: 3, textTransform: 'uppercase',
            }}>
              Powered by Gemini AI
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --- Camera View ---
  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B12' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        ref={(ref: any) => setCameraRef(ref)}
      />

      {/* OVERLAYS (Absolute Positioned outside CameraView) */}
      
      {/* Top Header Overlay */}
      <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 20, paddingTop: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A2E80', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>👤</Text>
            </View>
            <Text style={{ color: '#EEEEF0', fontSize: 18, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>NutriSnap</Text>
          </View>
          <View style={{ width: 40, height: 40 }} />
        </View>
      </SafeAreaView>

      {/* Scanner Frame Overlay */}
      <View pointerEvents="none" style={{
        position: 'absolute', top: 100, left: 24, right: 24, bottom: 160,
        borderWidth: 2, borderColor: '#00D4AA40', borderRadius: 24,
      }}>
        {/* Corner accents */}
        <View style={{ position: 'absolute', top: -1, left: -1, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#00D4AA', borderTopLeftRadius: 24 }} />
        <View style={{ position: 'absolute', top: -1, right: -1, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#00D4AA', borderTopRightRadius: 24 }} />
        <View style={{ position: 'absolute', bottom: -1, left: -1, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#00D4AA', borderBottomLeftRadius: 24 }} />
        <View style={{ position: 'absolute', bottom: -1, right: -1, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#00D4AA', borderBottomRightRadius: 24 }} />
      </View>

      {/* Instruction Pill */}
      <View pointerEvents="none" style={{
        position: 'absolute', top: 130, alignSelf: 'center',
        backgroundColor: '#1A1A2E90', borderRadius: 20,
        paddingVertical: 8, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 8,
        borderWidth: 1, borderColor: '#25254040',
      }}>
        <Text style={{ fontSize: 12 }}>📸</Text>
        <Text style={{ color: '#EEEEF0', fontSize: 12, fontWeight: '600' }}>Point at food & tap capture</Text>
      </View>

      {/* Bottom Capture Section */}
      <View style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        alignItems: 'center', paddingBottom: 30,
      }}>
        <TouchableOpacity
          onPress={snapFood}
          activeOpacity={0.8}
          style={{
            width: 76, height: 76, borderRadius: 38,
            backgroundColor: '#141420',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 3, borderColor: '#00D4AA40',
          }}
        >
          <View style={{
            width: 58, height: 58, borderRadius: 29,
            backgroundColor: '#0B0B12',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 2, borderColor: '#00D4AA',
          }}>
            <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#00D4AA' }} />
          </View>
        </TouchableOpacity>

        <Text style={{
          color: '#555570', fontSize: 11, fontWeight: '600',
          marginTop: 12, letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          Tap to capture
        </Text>
      </View>
    </View>
  );
}
