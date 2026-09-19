import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { DESIGN_TOKENS } from '../../types/design';

export interface EyebrowProps {
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
}

// Microscopic pill-shaped eyebrow badge preceding headlines.
const Eyebrow = ({ children, color, style }: EyebrowProps) => (
  <Text
    style={[
      styles.badge,
      {
        backgroundColor: DESIGN_TOKENS.colors.primaryDim,
        color: color ?? DESIGN_TOKENS.colors.primary,
      },
      style,
    ]}
  >
    {children}
  </Text>
);

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
});

export { Eyebrow };