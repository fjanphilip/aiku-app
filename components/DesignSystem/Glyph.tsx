import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

// Ultra-light precise line glyphs (Phosphor-light class).
// \uFE0E forces text-style rendering instead of emoji on iOS.
export type GlyphName =
  | 'arrowUpRight'
  | 'arrowUp'
  | 'plus'
  | 'close'
  | 'sparkle'
  | 'chevronRight'
  | 'dot'
  | 'more'
  | 'circle';

const GLYPHS: Record<GlyphName, string> = {
  arrowUpRight: '\u2197\uFE0E',
  arrowUp: '\u2191\uFE0E',
  plus: '\uFF0B\uFE0E',
  close: '\u2715\uFE0E',
  sparkle: '\u2726\uFE0E',
  chevronRight: '\u203A\uFE0E',
  dot: '\u2022\uFE0E',
  more: '\u22EE\uFE0E',
  circle: '\u25CB\uFE0E',
};

export interface GlyphProps {
  name: GlyphName;
  size?: number;
  color?: string;
  weight?: TextStyle['fontWeight'];
  style?: TextStyle;
}

const Glyph = ({ name, size = 14, color, weight = '400', style }: GlyphProps) => (
  <Text
    style={[
      styles.base,
      {
        fontSize: size,
        color: color ?? '#ffffff',
        fontWeight: weight,
      },
      style,
    ]}
  >
    {GLYPHS[name]}
  </Text>
);

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export { Glyph };