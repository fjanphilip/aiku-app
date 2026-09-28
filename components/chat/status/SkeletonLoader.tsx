import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { COLORS } from '../../../types/design';
import { useReduceMotion } from '../../../hooks/useReduceMotion';

/**
 * Placeholder berbentuk bubble jawaban. Hanya dipakai pada status `submitted`,
 * yaitu sebelum token atau langkah pertama datang.
 */
export const SkeletonLoader: React.FC = () => {
  const reduceMotion = useReduceMotion();
  const [shimmer] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, shimmer]);

  const opacity = reduceMotion
    ? 0.5
    : shimmer.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.35, 0.8, 0.35] });

  return (
    <View
      style={styles.container}
      accessibilityLabel='Menyiapkan jawaban'
      testID='assistant-skeleton'
    >
      <Animated.View style={[styles.bubble, { opacity }]}>
        <View style={[styles.line, styles.lineLong]} />
        <View style={[styles.line, styles.lineMedium]} />
        <View style={[styles.line, styles.lineShort]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    minWidth: 200,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2c2b30',
    backgroundColor: '#1d1c1f',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 9,
  },
  line: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  lineLong: {
    width: '88%',
  },
  lineMedium: {
    width: '70%',
  },
  lineShort: {
    width: '44%',
  },
});
