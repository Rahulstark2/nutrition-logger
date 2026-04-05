import { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Bell, Zap } from 'lucide-react-native';
import { router } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [cameraRef, setCameraRef] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the scan button
  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#0B0B12' }} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0B0B12', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: '#141420', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, borderWidth: 1, borderColor: '#252540',
        }}>
          <Zap size={32} color="#00D4AA" />
        </View>
        <Text style={{ color: '#EEEEF0', fontSize: 22, fontWeight: '800', marginBottom: 8, textAlign: 'center' }}>Camera Access Required</Text>
        <Text style={{ color: '#555570', fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
          Allow camera access to scan your food and get instant nutritional data.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={{
            backgroundColor: '#00D4AA', borderRadius: 16,
            paddingVertical: 16, paddingHorizontal: 48,
          }}
        >
          <Text style={{ color: '#0B0B12', fontSize: 16, fontWeight: '800' }}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const snapFood = async () => {
    if (!cameraRef) return;
    setScanning(true);

    try {
      const picture = await cameraRef.takePictureAsync({ base64: false, quality: 0.5 });
      // Simulate detection
      setTimeout(() => {
        setDetected(true);
        setScanning(false);
        // Navigate to result after a moment
        setTimeout(() => {
          setDetected(false);
          router.push('/result');
        }, 1500);
      }, 2500);
    } catch (e) {
      console.error(e);
      setScanning(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0B0B12' }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        ref={(ref: any) => setCameraRef(ref)}
      >
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
            <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#14142080', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} color="#8888A0" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Scanner Frame Overlay */}
        <View style={{
          position: 'absolute', top: 100, left: 24, right: 24, bottom: 160,
          borderWidth: 2, borderColor: '#00D4AA40', borderRadius: 24,
        }}>
          {/* Corner accents */}
          <View style={{ position: 'absolute', top: -1, left: -1, width: 28, height: 28, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#00D4AA', borderTopLeftRadius: 24 }} />
          <View style={{ position: 'absolute', top: -1, right: -1, width: 28, height: 28, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#00D4AA', borderTopRightRadius: 24 }} />
          <View style={{ position: 'absolute', bottom: -1, left: -1, width: 28, height: 28, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#00D4AA', borderBottomLeftRadius: 24 }} />
          <View style={{ position: 'absolute', bottom: -1, right: -1, width: 28, height: 28, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#00D4AA', borderBottomRightRadius: 24 }} />
        </View>

        {/* Status Pill */}
        {scanning && (
          <View style={{
            position: 'absolute', top: 130, alignSelf: 'center',
            backgroundColor: '#2A2A3A90', borderRadius: 20,
            paddingVertical: 8, paddingHorizontal: 20,
            flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
            <Text style={{ color: '#EEEEF0', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>Auto-Detecting...</Text>
          </View>
        )}

        {/* Detection Result Pill */}
        {detected && (
          <View style={{
            position: 'absolute', bottom: 180, alignSelf: 'center',
          }}>
            <View style={{
              backgroundColor: '#00D4AA30', borderRadius: 14,
              paddingVertical: 10, paddingHorizontal: 20,
              borderWidth: 1, borderColor: '#00D4AA50',
              alignItems: 'center',
            }}>
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>Food Detected</Text>
            </View>
            <Text style={{ color: '#8888A0', fontSize: 11, fontWeight: '600', letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center', marginTop: 6 }}>Confidence 98%</Text>
          </View>
        )}

        {/* Bottom Capture Section */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          alignItems: 'center', paddingBottom: 30,
        }}>
          {!scanning && !detected && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                onPress={snapFood}
                style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: '#141420',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 3, borderColor: '#252540',
                }}
              >
                <View style={{
                  width: 54, height: 54, borderRadius: 27,
                  backgroundColor: '#1A1A2E',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: '#303050',
                }}>
                  <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: '#00D4AA' }} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}

          {scanning && (
            <View style={{
              backgroundColor: '#141420', borderRadius: 20,
              paddingVertical: 14, paddingHorizontal: 24,
              flexDirection: 'row', alignItems: 'center', gap: 10,
              borderWidth: 1, borderColor: '#252540',
            }}>
              <Text style={{ color: '#00D4AA', fontSize: 14, fontWeight: '700' }}>Analyzing...</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}
