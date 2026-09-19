import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getStoredData } from '../services/storage';
import { COLORS } from '../types/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function RunningTextSplash({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const [translateX] = useState(() => new Animated.Value(-SCREEN_WIDTH * 0.5));
  const [opacity] = useState(() => new Animated.Value(0));
  const [dotScale] = useState(() => new Animated.Value(1));
  const [lineScaleX] = useState(() => new Animated.Value(0));
  const [screenOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Alur Animasi:
    // 1. Teks 'aiku' meluncur masuk dari kiri ke tengah layar
    // 2. Berhenti tepat di tengah (translateX = 0)
    // 3. Titik amber berdenyut halus & garis aksen di bawah melebar di tengah
    // 4. Diam sejenak di tengah agar terlihat jelas
    // 5. Fade out lembut ke antarmuka aplikasi
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 850,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // Berhenti di tengah: titik amber berdenyut & garis aksen muncul
      Animated.parallel([
        Animated.sequence([
          Animated.timing(dotScale, {
            toValue: 1.4,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(dotScale, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(lineScaleX, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // Berhenti sejenak di tengah (pause)
      Animated.delay(550),
      // Fade out lembut
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationComplete();
    });
  }, [translateX, opacity, dotScale, lineScaleX, screenOpacity, onAnimationComplete]);

  return (
    <Animated.View style={[styles.splashContainer, { opacity: screenOpacity }]}>
      <StatusBar style='light' />
      <View style={styles.centerStage}>
        <Animated.View
          style={[
            styles.runningBox,
            {
              transform: [{ translateX }],
              opacity,
            },
          ]}
        >
          <Text style={styles.aikuText}>aiku</Text>
          <Animated.View
            style={[
              styles.amberDot,
              {
                transform: [{ scale: dotScale }],
              },
            ]}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.subtleTrack,
            {
              transform: [{ scaleX: lineScaleX }],
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkInitialSettings = async () => {
      try {
        const stored = await getStoredData();
        const configured = !!stored.baseUrl && !!stored.apiKey;

        if (isMounted) {
          setIsConfigured(configured);
          setIsDataLoaded(true);
        }
      } catch (err) {
        console.error('Error saat memeriksa konfigurasi awal:', err);
        if (isMounted) {
          setIsDataLoaded(true);
        }
      }
    };

    checkInitialSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const isReady = isDataLoaded && isAnimationFinished;

  useEffect(() => {
    if (isReady && !isConfigured) {
      setTimeout(() => {
        router.replace('/(tabs)/settings');
      }, 50);
    }
  }, [isReady, isConfigured, router]);

  if (!isReady) {
    return (
      <RunningTextSplash
        onAnimationComplete={() => setIsAnimationFinished(true)}
      />
    );
  }

  return (
    <>
      <StatusBar style='light' />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='(tabs)' />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceBase,
  },
  centerStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  runningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aikuText: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 4,
    color: COLORS.textPrimary,
    textTransform: 'lowercase',
  },
  amberDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentYellow,
    marginTop: 8,
  },
  subtleTrack: {
    width: 54,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.accentYellow,
    marginTop: 10,
    opacity: 0.7,
  },
});