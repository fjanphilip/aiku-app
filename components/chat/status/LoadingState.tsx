import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { RunStatus } from '../../../types/aiRun';
import { COLORS } from '../../../types/design';
import { useReduceMotion } from '../../../hooks/useReduceMotion';

const STATUS_LABELS: Partial<Record<RunStatus, string>> = {
  submitted: 'Menyiapkan jawaban...',
  reasoning: 'Sedang berpikir...',
  tool_running: 'Menjalankan tool...',
  streaming: 'Menulis jawaban...',
};

interface LoadingStateProps {
  status: RunStatus;
}

/**
 * Penanda umum bahwa proses AI sedang berjalan. Hanya tampil saat run aktif;
 * komponen induk yang memutuskan kapan ia di-unmount.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ status }) => {
  const reduceMotion = useReduceMotion();
  const [pulse] = useState(() => new Animated.Value(0));
  const label = STATUS_LABELS[status];

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pulse]);

  if (!label) return null;

  const dotStyle = reduceMotion
    ? undefined
    : {
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
        transform: [
          { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) },
        ],
      };

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion='polite'
      accessibilityLabel={label}
      testID='assistant-loading-state'
    >
      <Animated.View style={[styles.dot, dotStyle]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentYellow,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
    color: COLORS.textSecondary,
  },
});
