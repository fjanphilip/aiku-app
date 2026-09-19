import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../types/design';
import { PaperclipGlyph, DiagonalArrowGlyph } from './DesignSystem';

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAbort: () => void;
  isLoading: boolean;
  placeholder?: string;
  onAttach?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChangeText,
  onSend,
  onAbort,
  isLoading,
  placeholder = 'Ask me anything...',
  onAttach,
}) => {
  const inputRef = useRef<TextInput | null>(null);
  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <View style={styles.outerShell}>
      <View style={styles.pillContainer}>
        {/* Attachment button on left */}
        <TouchableOpacity
          style={styles.attachBtn}
          onPress={onAttach}
          activeOpacity={0.7}
          accessibilityLabel="Lampirkan file atau konteks"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <PaperclipGlyph size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Text Input in center */}
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={4000}
          autoCapitalize="sentences"
          selectionColor={COLORS.accentYellow}
        />

        {/* Send / Stop button on right */}
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
            style={[
              styles.actionBtn,
              canSend ? styles.sendBtnActive : styles.sendBtnDisabled,
            ]}
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
  );
};

const styles = StyleSheet.create({
  outerShell: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 999,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
    color: COLORS.textPrimary,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 13,
    height: 13,
    backgroundColor: '#ffffff',
    borderRadius: 2.5,
  },
});

export default ChatInput;