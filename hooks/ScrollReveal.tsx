import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle, Easing } from 'react-native';

export interface ScrollRevealOptions {
  delay?: number;
  duration?: number;
  distance?: number;
  blur?: boolean;
  once?: boolean;
}

export interface ScrollRevealWrapper extends ScrollRevealOptions {
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
}

const EASE_PREMIUM = Easing.bezier(0.32, 0.72, 0, 1);

export function ScrollReveal({
  children,
  delay = 0,
  duration = 800,
  distance = 32,
  once = true,
  style,
}: ScrollRevealWrapper) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current && once) return;
    didRun.current = true;

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: EASE_PREMIUM,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        easing: EASE_PREMIUM,
        useNativeDriver: true,
      }),
    ]);

    animation.start();
    return () => animation.stop();
  }, [delay, duration, distance, once, opacity, translateY]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateY }],
        },
        styles.container,
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});