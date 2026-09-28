import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../types/design';
import { PaperclipGlyph, DiagonalArrowGlyph, ChevronDownGlyph } from './DesignSystem';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAbort: () => void;
  isLoading: boolean;
  placeholder?: string;
  onAttach?: () => void;
  activeModel?: string | null;
  onPressModel?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onAbort,
  isLoading,
  placeholder = 'Ask me anything...',
  onAttach,
  activeModel,
  onPressModel,
}) => {
  const inputRef = useRef<TextInput | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <View style={styles.outerShell}>
      <View style={[styles.composer, isFocused && styles.composerFocused]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
          maxLength={4000}
          autoCapitalize="sentences"
          selectionColor={COLORS.accentYellow}
        />

        {/* Toolbar: attach di kiri, pemilih model + kirim di kanan */}
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={onAttach}
            activeOpacity={0.7}
            accessibilityLabel="Lampirkan file atau konteks"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <PaperclipGlyph size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.spacer} />

          {onPressModel && (
            <TouchableOpacity
              style={styles.modelBtn}
              onPress={onPressModel}
              activeOpacity={0.75}
              accessibilityLabel={`Model aktif ${activeModel ?? 'belum dipilih'}. Ketuk untuk mengganti.`}
            >
              <Text style={styles.modelBtnText} numberOfLines={1}>
                {activeModel ?? 'Pilih model'}
              </Text>
              <ChevronDownGlyph size={13} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}

          {isLoading ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.stopBtn]}
              onPress={onAbort}
              activeOpacity={0.85}
              accessibilityLabel="Hentikan respon"
            >
              <View style={styles.stopIcon} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, canSend ? styles.sendBtnActive : styles.sendBtnDisabled]}
              onPress={onSend}
              disabled={!canSend}
              activeOpacity={0.85}
              accessibilityLabel="Kirim pesan"
            >
              <DiagonalArrowGlyph
                size={18}
                color={canSend ? COLORS.onAccentYellow : COLORS.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerShell: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  composer: {
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  composerFocused: {
    borderColor: 'rgba(255, 199, 44, 0.55)',
  },
  input: {
    minHeight: 24,
    maxHeight: 140,
    paddingHorizontal: 2,
    paddingTop: 0,
    paddingBottom: 8,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    color: COLORS.textPrimary,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  modelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 170,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  modelBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flexShrink: 1,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: COLORS.accentYellow,
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.surfaceContainerHighest,
  },
  stopBtn: {
    backgroundColor: COLORS.error,
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  stopIcon: {
    width: 12,
    height: 12,
    backgroundColor: '#ffffff',
    borderRadius: 2.5,
  },
});

export default ChatInput;
