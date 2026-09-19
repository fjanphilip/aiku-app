import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { DESIGN_TOKENS, RADIUS } from '../../types/design';
import { ScrollReveal } from '../../hooks/ScrollReveal';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'elevated' | 'flat';
  scrollReveal?: boolean;
  scrollRevealDelay?: number;
  scrollRevealDuration?: number;
}

// Double-Bezel (Doppelrand): outer shell + inner core.
// Outer shell wears the hairline ring; inner core carries the
// machined inset highlight — a glass plate in an aluminum tray.
const Card = ({
  children,
  onPress,
  style,
  variant = 'flat',
  scrollReveal = false,
  scrollRevealDelay = 0,
  scrollRevealDuration = 800,
}: CardProps) => {
  const inner = {
    paddingHorizontal: 20,
    paddingVertical: 24,
    ...variant === 'elevated' ? styles.elevatedInner : styles.flatInner,
    ...style,
  } as ViewStyle;

  const content = (
    <View style={[styles.outerShell, variant === 'elevated' ? styles.elevatedShell : styles.flatShell]}>
      {onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={inner}>
          {children}
        </TouchableOpacity>
      ) : (
        <View style={inner}>{children}</View>
      )}
    </View>
  );

  if (scrollReveal) {
    return (
      <ScrollReveal delay={scrollRevealDelay} duration={scrollRevealDuration}>
        {content}
      </ScrollReveal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  outerShell: {
    borderRadius: RADIUS.doppelOuter,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  flatShell: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  elevatedShell: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 32,
    elevation: 16,
  },
  flatInner: {
    backgroundColor: DESIGN_TOKENS.colors.background.card,
    borderRadius: RADIUS.doppelInner,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  elevatedInner: {
    backgroundColor: DESIGN_TOKENS.colors.background.elevated,
    borderRadius: RADIUS.doppelInner,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
});

export { Card };