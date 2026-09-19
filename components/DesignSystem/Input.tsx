import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { DESIGN_TOKENS } from '../../types/design';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  inputContainerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
  icon?: React.ReactNode;
}

const Input = ({
  label,
  error,
  helperText,
  inputContainerStyle,
  showPasswordToggle = false,
  icon,
  secureTextEntry = false,
  ...props
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: isFocused
                ? DESIGN_TOKENS.colors.primary
                : DESIGN_TOKENS.colors.text.muted,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputShell,
          isFocused && styles.inputShellFocused,
          error && styles.inputShellError,
          inputContainerStyle,
        ]}
      >
        {icon && <View style={styles.iconWrapper}>{icon}</View>}

        <TextInput
          {...props}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          placeholderTextColor={DESIGN_TOKENS.colors.text.muted}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          autoCapitalize={props.autoCapitalize ?? 'none'}
          autoCorrect={props.autoCorrect ?? false}
          style={[styles.input, props.style]}
        />

        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.toggle,
                {
                  color: isFocused
                    ? DESIGN_TOKENS.colors.primary
                    : DESIGN_TOKENS.colors.text.secondary,
                },
              ]}
            >
              {isPasswordVisible ? 'Hide' : 'Show'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginLeft: 2,
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1b1e',
    borderWidth: 1,
    borderColor: '#2C2B31',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  inputShellFocused: {
    borderColor: DESIGN_TOKENS.colors.primary,
    borderWidth: 1.5,
  },
  inputShellError: {
    borderColor: '#EF4444',
  },
  iconWrapper: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: DESIGN_TOKENS.colors.text.primary,
    padding: 0,
  },
  toggle: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 12,
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  helperText: {
    color: DESIGN_TOKENS.colors.text.muted,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});

export { Input };