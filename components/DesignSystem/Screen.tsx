import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DESIGN_TOKENS } from '../../types/design';

export interface ScreenProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const Screen: React.FC<ScreenProps> = ({ children, style }) => (
  <View style={[styles.screen, style]}>
    {children}
  </View>
);

export interface GradientFieldProps {
  style?: ViewStyle;
  children?: React.ReactNode;
  intensity?: 'quiet' | 'signature' | 'cinematic';
}

interface OrbConfig {
  top: number;
  left: number;
  w: number;
  h: number;
  start: string;
  end: string;
}

const GRADIENT_METADATA: Record<string, { orbs: OrbConfig[]; meshOpacity: number }> = {
  quiet: {
    orbs: [
      { top: -140, left: -160, w: 380, h: 380, start: 'rgba(255, 199, 44, 0.12)', end: 'transparent' },
      { top: 320, left: 240, w: 400, h: 400, start: 'rgba(42, 36, 18, 0.20)', end: 'transparent' },
    ],
    meshOpacity: 0.5,
  },
  signature: {
    orbs: [
      { top: -160, left: -120, w: 420, h: 420, start: 'rgba(255, 199, 44, 0.15)', end: 'transparent' },
      { top: 260, left: 190, w: 460, h: 460, start: 'rgba(42, 36, 18, 0.28)', end: 'transparent' },
    ],
    meshOpacity: 0.65,
  },
  cinematic: {
    orbs: [
      { top: -180, left: -140, w: 480, h: 480, start: 'rgba(255, 199, 44, 0.18)', end: 'transparent' },
      { top: 240, left: 180, w: 520, h: 520, start: 'rgba(42, 36, 18, 0.35)', end: 'transparent' },
    ],
    meshOpacity: 0.8,
  },
};

export const GradientFieldBackground: React.FC<GradientFieldProps> = ({
  style,
  intensity = 'signature',
}) => {
  const cfg = GRADIENT_METADATA[intensity] ?? GRADIENT_METADATA.signature;

  return (
    <View style={[styles.field, style]} pointerEvents='none' testID='gradient-field-background'>
      {cfg.orbs.map((orb, idx) => (
        <View
          key={idx}
          style={[
            styles.orb,
            {
              top: orb.top,
              left: orb.left,
              width: orb.w,
              height: orb.h,
              opacity: cfg.meshOpacity,
            },
          ]}
        >
          <LinearGradient style={StyleSheet.absoluteFill} colors={[orb.start, orb.end]} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DESIGN_TOKENS.colors.background.background,
  },
  field: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
});