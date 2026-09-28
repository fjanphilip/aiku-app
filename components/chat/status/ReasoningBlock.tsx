import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../../types/design';
import { ChevronDownGlyph } from '../../DesignSystem';

interface ReasoningBlockProps {
  reasoning: string;
}

/**
 * Menampilkan teks reasoning yang datang bertahap.
 * Default terlipat: hanya baris terakhir yang terlihat.
 */
export const ReasoningBlock: React.FC<ReasoningBlockProps> = ({ reasoning }) => {
  const [expanded, setExpanded] = useState(false);

  const lines = reasoning
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const preview = lines[lines.length - 1];

  return (
    <View style={styles.container} testID='assistant-reasoning-block'>
      <TouchableOpacity
        onPress={() => setExpanded((value) => !value)}
        activeOpacity={0.75}
        accessibilityRole='button'
        accessibilityState={{ expanded }}
        accessibilityLabel={
          expanded ? 'Sembunyikan proses berpikir' : 'Tampilkan proses berpikir'
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>BERPIKIR</Text>
          <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
            <ChevronDownGlyph size={12} color={COLORS.textMuted} />
          </View>
        </View>

        {!expanded && (
          <Text style={styles.preview} numberOfLines={1}>
            {preview}
          </Text>
        )}
      </TouchableOpacity>

      {expanded && (
        <ScrollView style={styles.body} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <Text style={styles.bodyText}>{reasoning.trim()}</Text>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 199, 44, 0.5)',
    backgroundColor: 'rgba(255, 199, 44, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: COLORS.textMuted,
  },
  preview: {
    marginTop: 6,
    fontSize: 12.5,
    lineHeight: 18,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
  },
  body: {
    marginTop: 8,
    maxHeight: 220,
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
});
