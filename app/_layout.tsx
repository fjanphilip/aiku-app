import { Stack, useRouter, ThemeProvider, DarkTheme, type Theme } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Animated, Dimensions, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getStoredData } from '../services/storage';
import { COLORS } from '../types/design';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// expo-router memakai DefaultTheme (terang) selama app tidak menyediakan tema,
// sehingga container screen berwarna rgb(242, 242, 242) dan terlihat sebagai
// celah putih di atas keyboard. Semua permukaan navigasi diselaraskan ke token app.
const AIKU_NAV_THEME: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: COLORS.surfaceBase,
    card: COLORS.surfaceBase,
    border: COLORS.borderSubtle,
    text: COLORS.textPrimary,
    primary: COLORS.accentYellow,
    notification: COLORS.accentYellow,
  },
};

function RunningTextSplash({ onAnimationComplete }: { onAnimationComplete: () => void }) {
  const [translateX] = useState(() => new Animated.Value(-SCREEN_WIDTH * 0.5));
  const [opacity] = useState(() => new Animated.Value(0));
  const [lineScaleX] = useState(() => new Animated.Value(0));
  const [screenOpacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Alur Animasi:
    // 1. Logo Aiku meluncur masuk dari kiri ke tengah layar
    // 2. Berhenti tepat di tengah (translateX = 0)
    // 3. Garis aksen di bawah logo melebar di tengah
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
      // Berhenti di tengah: garis aksen muncul
      Animated.timing(lineScaleX, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
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
  }, [translateX, opacity, lineScaleX, screenOpacity, onAnimationComplete]);

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
          <Image
            source={require('../assets/splash-icon.png')}
            style={styles.splashLogo}
            resizeMode='contain'
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

  return (
    <ThemeProvider value={AIKU_NAV_THEME}>
      {isReady ? (
        <>
          <StatusBar style='light' />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.surfaceBase },
            }}
          >
            <Stack.Screen name='(tabs)' />
          </Stack>
        </>
      ) : (
        <RunningTextSplash onAnimationComplete={() => setIsAnimationFinished(true)} />
      )}
    </ThemeProvider>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 200,
    height: 214,
  },
  subtleTrack: {
    width: 54,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.accentYellow,
    marginTop: 22,
    opacity: 0.7,
  },
});
