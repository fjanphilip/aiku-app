import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ChatMessage } from '../types/chat';
import { COLORS } from '../types/design';
import MarkdownRenderer from './MarkdownRenderer';
import { TypingIndicator } from './TypingIndicator';
import { CopyGlyph, CheckGlyph } from './DesignSystem';

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isStreaming = false }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!message.content) return;
    await Clipboard.setStringAsync(message.content);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  if (!isUser && !message.content.trim()) {
    return (
      <View style={[styles.bubbleContainer, styles.assistantContainer]}>
        <TypingIndicator label="Aiku sedang berpikir..." />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubbleContainer,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
      testID={`bubble_${message.role}_${message.id}`}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {isUser ? (
          <Text style={styles.userText}>{message.content}</Text>
        ) : (
          <>
            <MarkdownRenderer content={message.content} />
            {isStreaming && (
              <View style={styles.streamingRow}>
                <View style={styles.streamingDot} />
                <Text style={styles.streamingText}>Sedang menjawab...</Text>
              </View>
            )}
          </>
        )}

        <View style={styles.footerRow}>
          {message.createdAt && (
            <Text style={[styles.timeText, isUser ? styles.userTime : styles.assistantTime]}>
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}

          {!isUser && message.content ? (
            <TouchableOpacity
              style={[
                styles.copyBtn,
                copied && styles.copyBtnSuccess,
              ]}
              onPress={handleCopy}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              accessibilityLabel={copied ? 'Teks disalin' : 'Salin pesan'}
            >
              {copied ? (
                <CheckGlyph size={12} color="#10B981" />
              ) : (
                <CopyGlyph size={12} color={COLORS.textMuted} />
              )}
              <Text
                style={[
                  styles.copyText,
                  { color: copied ? '#10B981' : COLORS.textMuted },
                ]}
              >
                {copied ? 'Disalin' : 'Salin'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bubbleContainer: {
    marginVertical: 5,
    paddingHorizontal: 16,
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: '#28272b',
    borderWidth: 1,
    borderColor: '#38373f',
    borderBottomRightRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  assistantBubble: {
    backgroundColor: '#1d1c1f',
    borderWidth: 1,
    borderColor: '#2c2b30',
    borderBottomLeftRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  userText: {
    color: '#F4F4F6',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  timeText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  userTime: {
    color: 'rgba(244, 244, 246, 0.55)',
  },
  assistantTime: {
    color: COLORS.textMuted,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  copyBtnSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  copyText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  streamingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 2,
  },
  streamingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentYellow,
  },
  streamingText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
  },
});

export default ChatBubble;