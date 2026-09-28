import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { COLORS } from '../types/design';
import {
  SparklesGlyph,
  EditNoteGlyph,
  LightbulbGlyph,
  SummarizeGlyph,
  ChevronGlyph,
} from './DesignSystem';

interface SuggestionItem {
  id: string;
  prompt: string;
  glyph: 'sparkles' | 'edit_note' | 'lightbulb' | 'summarize';
}

const SUGGESTIONS: SuggestionItem[] = [
  {
    id: 'sug_1',
    prompt: 'What can you do?',
    glyph: 'sparkles',
  },
  {
    id: 'sug_2',
    prompt: 'Help me write something',
    glyph: 'edit_note',
  },
  {
    id: 'sug_3',
    prompt: 'Explain a topic',
    glyph: 'lightbulb',
  },
  {
    id: 'sug_4',
    prompt: 'Summarize this text',
    glyph: 'summarize',
  },
];

interface EmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const renderSuggestionIcon = (glyph: SuggestionItem['glyph']) => {
  switch (glyph) {
    case 'sparkles':
      return <SparklesGlyph size={18} color={COLORS.accentYellow} />;
    case 'edit_note':
      return <EditNoteGlyph size={18} color={COLORS.accentYellow} />;
    case 'lightbulb':
      return <LightbulbGlyph size={18} color={COLORS.accentYellow} />;
    case 'summarize':
      return <SummarizeGlyph size={18} color={COLORS.accentYellow} />;
  }
};

/**
 * Tampilan sambutan saat percakapan masih kosong.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ onSelectPrompt }) => (
  <ScrollView
    contentContainerStyle={styles.scrollContent}
    showsVerticalScrollIndicator={false}
    keyboardShouldPersistTaps="handled"
  >
    <View style={styles.centerContent}>
      {/* Companion Avatar Orb with Amber Glow */}
      <View style={styles.avatarWrapper}>
        <View style={styles.avatarAmbientGlow} />
        <View style={styles.avatarOrb}>
          <Image
            source={require('../assets/aiku-avatar.jpg')}
            style={styles.avatarImage}
            resizeMode="cover"
          />
          {/* Online presence indicator dot */}
          <View style={styles.presenceBadge}>
            <View style={styles.presenceDot} />
          </View>
        </View>
      </View>

      {/* Heading and Subtitle */}
      <Text style={styles.title}>Aiku</Text>
      <Text style={styles.subtitle}>Hello! How can I help you today?</Text>

      {/* 4 Suggestion Action Buttons */}
      <View style={styles.suggestionsContainer}>
        {SUGGESTIONS.map((item) => {
          const isHighlighted = item.glyph === 'sparkles';
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionButton}
              onPress={() => onSelectPrompt(item.prompt)}
              activeOpacity={0.78}
              accessibilityRole="button"
              accessibilityLabel={item.prompt}
            >
              <View style={styles.suggestionLeft}>
                <View
                  style={[
                    styles.suggestionIconBadge,
                    isHighlighted
                      ? styles.suggestionIconBadgeHighlighted
                      : styles.suggestionIconBadgeNormal,
                  ]}
                >
                  {renderSuggestionIcon(item.glyph)}
                </View>
                <Text style={styles.suggestionText} numberOfLines={1}>
                  {item.prompt}
                </Text>
              </View>
              <ChevronGlyph size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  centerContent: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarAmbientGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 199, 44, 0.12)',
  },
  avatarOrb: {
    position: 'relative',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 44, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  presenceBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accentYellow,
    borderWidth: 3,
    borderColor: COLORS.surfaceBase,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.onAccentYellow,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 26,
    lineHeight: 22,
  },
  suggestionsContainer: {
    width: '100%',
    gap: 10,
  },
  suggestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  suggestionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionIconBadgeHighlighted: {
    backgroundColor: COLORS.accentYellowContainer,
  },
  suggestionIconBadgeNormal: {
    backgroundColor: COLORS.surfaceContainer,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
    letterSpacing: -0.15,
    flexShrink: 1,
  },
});
