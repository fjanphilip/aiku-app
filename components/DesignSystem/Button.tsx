import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Animated,
  Pressable,
  ViewStyle,
} from 'react-native';
import { DESIGN_TOKENS } from '../../types/design';

export interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: ViewStyle;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

const SIZES: Record<string, ViewStyle> = {
  small: { paddingVertical: 10, paddingHorizontal: 18 },
  medium: { paddingVertical: 14, paddingHorizontal: 24 },
  large: { paddingVertical: 18, paddingHorizontal: 28 },
};

const FONT_SIZES: Record<string, number> = {
  small: 14,
  medium: 16,
  large: 18,
};

const Button = ({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leadingIcon,
  trailingIcon,
}: ButtonProps) => {
  const [scale] = useState(() => new Animated.Value(1));
  // Button-in-Button kinetic tension: inner icon circle drifts
  // diagonally on press (magnetic hover physics, mobile analog).
  const [iconDrift] = useState(() => new Animated.Value(0));

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0.97,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(iconDrift, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        speed: 30,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.timing(iconDrift, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const containerStyle: ViewStyle = {
    backgroundColor:
      variant === 'primary'
        ? DESIGN_TOKENS.colors.primary
        : variant === 'secondary'
          ? DESIGN_TOKENS.colors.border.weak
          : 'transparent',
    borderColor:
      variant === 'ghost'
        ? DESIGN_TOKENS.colors.border.hairline
        : 'transparent',
    borderWidth: variant === 'ghost' ? 1 : 0,
    paddingVertical: SIZES[size].paddingVertical,
    paddingHorizontal: SIZES[size].paddingHorizontal,
  };

  const contentColor =
    variant === 'primary'
      ? '#1A1400'
      : variant === 'secondary'
        ? DESIGN_TOKENS.colors.text.primary
        : DESIGN_TOKENS.colors.text.primary;

  const iconBg =
    variant === 'primary'
      ? 'rgba(0, 0, 0, 0.15)'
      : DESIGN_TOKENS.colors.border.weak;

  const renderTrailingIcon = () => {
    if (!trailingIcon) return null;
    return (
      <Animated.View
        style={[
          styles.iconCircle,
          { backgroundColor: iconBg },
          {
            transform: [
              {
                translateX: iconDrift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 2],
                }),
              },
              {
                translateY: iconDrift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -1],
                }),
              },
              {
                scale: iconDrift.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.06],
                }),
              },
            ],
          },
        ]}
      >
        {trailingIcon}
      </Animated.View>
    );
  };

  const content = loading ? (
    <ActivityIndicator
      size="small"
      color={variant === 'primary' ? '#ffffff' : DESIGN_TOKENS.colors.text.primary}
    />
  ) : (
    <View style={styles.row}>
      {leadingIcon && <View style={styles.leadingIcon}>{leadingIcon}</View>}
      <Text
        style={[
          styles.label,
          { color: contentColor, fontSize: FONT_SIZES[size] },
          textStyle,
        ]}
      >
        {children}
      </Text>
      {renderTrailingIcon()}
    </View>
  );

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.base,
          containerStyle,
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {content}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    // Soft, highly diffused ambient shadow — never harsh drop shadows
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  disabled: {
    opacity: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  // Button-in-Button: trailing icon nested in its own circular island
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  leadingIcon: {
    marginRight: 12,
  },
});

export { Button };