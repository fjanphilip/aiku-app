import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DESIGN_TOKENS } from '../../types/design';

export type TabIconName = 'chat' | 'history' | 'settings';

interface TabIconProps {
  name: TabIconName;
  color?: string;
  size?: number;
}

const STROKE = 1.6;

// Ultra-thin line icons drawn with Views — no emoji, no icon fonts.
const ChatIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={[
        styles.bubble,
        {
          width: size * 0.92,
          height: size * 0.74,
          borderRadius: size * 0.28,
          borderWidth: STROKE,
          borderColor: color,
        },
      ]}
    />
    <View
      style={[
        styles.tail,
        {
          width: size * 0.22,
          height: size * 0.22,
          left: size * 0.24,
          top: size * 0.62,
          borderRightWidth: STROKE,
          borderBottomWidth: STROKE,
          borderColor: color,
          transform: [{ rotate: '-12deg' }],
        },
      ]}
    />
  </View>
);

const HistoryIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        width: size * 0.88,
        height: size * 0.88,
        borderRadius: size * 0.44,
        borderWidth: STROKE,
        borderColor: color,
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: STROKE,
        height: size * 0.3,
        backgroundColor: color,
        borderRadius: 1,
        transform: [{ rotate: '-135deg' }],
      }}
    />
    <View
      style={{
        position: 'absolute',
        width: STROKE,
        height: size * 0.26,
        backgroundColor: color,
        borderRadius: 1,
        transform: [{ rotate: '48deg' }],
      }}
    />
  </View>
);

const SettingsIcon = ({ color, size }: { color: string; size: number }) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
      gap: size * 0.14,
    }}
  >
    {[0.46, 0.3, 0.4].map((knobPos, i) => (
      <View
        key={i}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: size,
          height: STROKE + 1,
        }}
      >
        <View
          style={{
            flex: 1,
            height: STROKE,
            backgroundColor: color,
            borderRadius: 1,
            opacity: 0.75,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: size * knobPos,
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: size * 0.11,
            backgroundColor: color,
            borderWidth: STROKE,
            borderColor: '#0a0a0e',
          }}
        />
      </View>
    ))}
  </View>
);

const TabIcon = ({ name, color = DESIGN_TOKENS.colors.text.primary, size = 20 }: TabIconProps) => {
  const stroke = color ?? DESIGN_TOKENS.colors.text.primary;
  switch (name) {
    case 'chat':
      return <ChatIcon color={stroke} size={size} />;
    case 'history':
      return <HistoryIcon color={stroke} size={size} />;
    case 'settings':
      return <SettingsIcon color={stroke} size={size} />;
    default:
      return null;
  }
};

const styles = StyleSheet.create({
  bubble: {},
  tail: {
    position: 'absolute',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
});

export { TabIcon };