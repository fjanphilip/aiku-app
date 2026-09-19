import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../types/design';

interface TypingIndicatorProps {
  label?: string;
  dotSize?: number;
  dotColor?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  label = 'Sedang berpikir...',
  dotSize = 6,
  dotColor = COLORS.accentYellow,
}) => {
  const [dot1] = useState(() => new Animated.Value(0));
  const [dot2] = useState(() => new Animated.Value(0));
  const [dot3] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const createAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 320,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 320,
              useNativeDriver: true,
            }),
            Animated.delay(260),
          ])
        ),
      ]);
    };

    const animLoop1 = createAnimation(dot1, 0);
    const animLoop2 = createAnimation(dot2, 160);
    const animLoop3 = createAnimation(dot3, 320);

    animLoop1.start();
    animLoop2.start();
    animLoop3.start();

    return () => {
      animLoop1.stop();
      animLoop2.stop();
      animLoop3.stop();
    };
  }, [dot1, dot2, dot3]);

  const renderDot = (anim: Animated.Value) => {
    const translateY = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -5],
    });
    const opacity = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 1],
    });
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.85, 1.2],
    });

    return (
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          {renderDot(dot1)}
          {renderDot(dot2)}
          {renderDot(dot3)}
        </View>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    alignItems: 'flex-start',
    width: '100%',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 14,
  },
  dot: {
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    letterSpacing: -0.2,
  },
});

export default TypingIndicator;
