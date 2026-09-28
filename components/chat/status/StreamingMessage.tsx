import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../../types/design';
import { useReduceMotion } from '../../../hooks/useReduceMotion';

interface StreamingMessageProps {
  text: string;
  showCursor?: boolean;
}

/**
 * Bubble jawaban yang teksnya bertambah bertahap.
 *
 * Sengaja memakai <Text> biasa, bukan MarkdownRenderer: markdown yang belum
 * lengkap di tengah stream sering tidak valid, dan merender markdown setiap
 * flush akan jauh lebih mahal. Pesan final tetap dirender sebagai markdown
 * oleh ChatBubble setelah tersimpan di SQLite.
 */
export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  text,
  showCursor = true,
}) => {
  const reduceMotion = useReduceMotion();
  const [blink] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!showCursor || reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, {
          toValue: 0.15,
          duration: 480,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blink, {
          toValue: 1,
          duration: 480,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [showCursor, reduceMotion, blink]);

  if (!text) return null;

  return (
    <View style={styles.container} testID='assistant-streaming-message'>
      <View style={styles.bubble}>
        <Text style={styles.text}>
          {text}
          {showCursor ? <Animated.Text style={[styles.cursor, { opacity: blink }]}>▍</Animated.Text> : null}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2c2b30',
    backgroundColor: '#1d1c1f',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    color: COLORS.textPrimary,
  },
  cursor: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.accentYellow,
  },
});
