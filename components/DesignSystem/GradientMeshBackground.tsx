import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, ViewStyle, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export interface GradientMeshBackgroundProps {
  style?: ViewStyle;
  children?: React.ReactNode;
}

// Stitch Minimalist UI: Warm ambient golden halo behind content
// Slowly breathes with GPU-accelerated transforms and zero layout thrash.
const GradientMeshBackground = ({ style, children }: GradientMeshBackgroundProps) => {
  const [drift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: 10000,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);

  const haloScale = drift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.08, 1],
  });

  const haloOpacity = drift.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.75, 1, 0.75],
  });

  return (
    <View style={[StyleSheet.absoluteFill, styles.container, style]} pointerEvents="none">
      {/* Top golden ambient halo behind avatar / header */}
      <Animated.View
        style={[
          styles.goldenHalo,
          {
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255, 199, 44, 0.14)', 'rgba(255, 199, 44, 0.03)', 'transparent']}
          start={{ x: 0.5, y: 0.2 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.fill}
        />
      </Animated.View>

      {/* Subtle warm base gradient at top */}
      <View style={styles.topVignette}>
        <LinearGradient
          colors={['rgba(42, 36, 18, 0.25)', 'transparent']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={styles.fill}
        />
      </View>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    zIndex: 0,
    backgroundColor: '#121214',
  },
  goldenHalo: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export { GradientMeshBackground };