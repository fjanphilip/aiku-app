import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { DESIGN_TOKENS } from '../../types/design';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  size?: 'small' | 'medium' | 'large';
  outlined?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

const VARIANTS: Record<string, { bg: string; border: string; fg: string }> = {
  primary: {
    bg: DESIGN_TOKENS.colors.primaryDim,
    border: DESIGN_TOKENS.colors.primary,
    fg: DESIGN_TOKENS.colors.primary,
  },
  secondary: {
    bg: DESIGN_TOKENS.colors.border.weak,
    border: DESIGN_TOKENS.colors.text.secondary,
    fg: DESIGN_TOKENS.colors.text.secondary,
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.15)',
    border: '#10B981',
    fg: '#10B981',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.15)',
    border: '#EF4444',
    fg: '#EF4444',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.15)',
    border: '#F59E0B',
    fg: '#F59E0B',
  },
};

const SIZES: Record<string, { px: number; py: number; font: number }> = {
  small: { px: 10, py: 4, font: 10 },
  medium: { px: 14, py: 6, font: 11 },
  large: { px: 18, py: 8, font: 13 },
};

const Badge = ({
  children,
  variant = 'primary',
  size = 'medium',
  outlined = false,
  onPress,
  style,
}: BadgeProps) => {
  const v = VARIANTS[variant];
  const s = SIZES[size];

  const badge = (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: s.px,
          paddingVertical: s.py,
          backgroundColor: outlined ? 'transparent' : v.bg,
          borderColor: v.border,
          borderWidth: outlined ? 1 : 0,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: v.fg, fontSize: s.font }]}>
        {children}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {badge}
      </TouchableOpacity>
    );
  }

  return badge;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});

export { Badge };