import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { DESIGN_TOKENS } from '../../types/design';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const Chip = ({ label, selected = false, onPress, icon, style }: ChipProps) => {
  const chip = (
    <View
      style={[
        styles.container,
        selected ? styles.selected : styles.default,
        style,
      ]}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.label,
          {
            color: selected
              ? DESIGN_TOKENS.colors.primary
              : DESIGN_TOKENS.colors.text.secondary,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {chip}
      </TouchableOpacity>
    );
  }

  return chip;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  default: {
    backgroundColor: 'transparent',
    borderColor: DESIGN_TOKENS.colors.border.hairline,
  },
  selected: {
    backgroundColor: DESIGN_TOKENS.colors.primaryDim,
    borderColor: DESIGN_TOKENS.colors.primary,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export { Chip };