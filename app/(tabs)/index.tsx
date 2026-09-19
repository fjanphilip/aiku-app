import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  ScrollView,
  StatusBar as RNStatusBar,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat } from '../../hooks/useChat';
import { useKeyboard } from '../../hooks/useKeyboard';
import { ChatBubble } from '../../components/ChatBubble';
import { ChatInput } from '../../components/ChatInput';
import { SidebarDrawer } from '../../components/SidebarDrawer';
import { TypingIndicator } from '../../components/TypingIndicator';
import { ChatMessage } from '../../types/chat';
import { COLORS } from '../../types/design';
import {
  GradientMeshBackground,
  SparklesGlyph,
  EditNoteGlyph,
  LightbulbGlyph,
  SummarizeGlyph,
  ChevronGlyph,
  LockGlyph,
  HamburgerGlyph,
  PlusGlyph,
} from '../../components/DesignSystem';

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

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    sendMessage,
    abort,
    loadSession,
    startNewChat,
    activeModel,
    sessionId,
    refreshActiveModel,
  } = useChat();

  const params = useLocalSearchParams<{ sessionId?: string }>();
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshActiveModel();
    }, [refreshActiveModel])
  );

  useEffect(() => {
    if (params.sessionId && params.sessionId !== sessionId) {
      loadSession(params.sessionId);
    }
  }, [params.sessionId, sessionId, loadSession]);

  useEffect(() => {
    if (messages.length > 0 || isLoading) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
  };

  const handleSuggestionPress = (prompt: string) => {
    setInputValue(prompt);
  };

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

  const renderEmpty = () => (
    <ScrollView
      contentContainerStyle={styles.emptyScrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.emptyCenterContent}>
        {/* Companion Avatar Orb with Amber Glow */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarAmbientGlow} />
          <View style={styles.avatarOrb}>
            <Image
              source={require('../../assets/aiku-avatar.jpg')}
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
        <Text style={styles.emptyTitle}>Aiku</Text>
        <Text style={styles.emptySubtitle}>Hello! How can I help you today?</Text>

        {/* 4 Suggestion Action Buttons */}
        <View style={styles.suggestionsContainer}>
          {SUGGESTIONS.map((item) => {
            const isHighlighted = item.glyph === 'sparkles';
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionButton}
                onPress={() => handleSuggestionPress(item.prompt)}
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 0) : 0}
    >
      <View style={styles.canvas}>
        <GradientMeshBackground />

        {/* Left Sidebar Drawer */}
        <SidebarDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewChat={startNewChat}
          onSelectSession={(id) => {
            loadSession(id);
          }}
          onOpenSettings={() => {
            router.push('/(tabs)/settings');
          }}
          currentSessionId={sessionId}
          activeModel={activeModel ?? undefined}
        />

        {/* Header: Hamburger Menu (Left) | Brand & Model (Center) | + New Chat (Right) */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 14) + 6 }]}>
          <TouchableOpacity
            style={styles.hamburgerBtn}
            onPress={() => setIsSidebarOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Buka menu riwayat dan navigasi"
            activeOpacity={0.75}
          >
            <HamburgerGlyph size={20} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Aiku</Text>
            {activeModel && (
              <TouchableOpacity
                style={styles.modelBadge}
                onPress={() => router.push('/(tabs)/settings')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                activeOpacity={0.75}
                accessibilityLabel={`Model aktif: ${activeModel}. Ketuk untuk ke pengaturan.`}
              >
                <View style={styles.modelStatusDot} />
                <Text style={styles.modelBadgeText} numberOfLines={1}>
                  {activeModel}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.headerNewChatBtn}
            onPress={startNewChat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Percakapan baru"
            activeOpacity={0.75}
          >
            <PlusGlyph size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Conversation List or Stitch Empty State */}
        {messages.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item, index }) => (
              <ChatBubble
                message={item}
                isStreaming={
                  isLoading &&
                  index === messages.length - 1 &&
                  item.role === 'assistant'
                }
              />
            )}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              isLoading &&
              (messages.length === 0 ||
                messages[messages.length - 1].role === 'user' ||
                !messages[messages.length - 1].content.trim()) ? (
                <TypingIndicator label="Aiku sedang berpikir..." />
              ) : null
            }
          />
        )}

        {/* Bottom Chat Bar & Encryption Footnote */}
        <View
          style={[
            styles.bottomArea,
            {
              paddingBottom: keyboard.visible
                ? (Platform.OS === 'ios' ? 8 : 6)
                : (Platform.OS === 'ios' ? 24 : 16),
            },
          ]}
        >
          <ChatInput
            value={inputValue}
            onChangeText={setInputValue}
            onSend={handleSend}
            onAbort={abort}
            isLoading={isLoading}
            placeholder="Ask me anything..."
          />

          <View style={styles.footerNote}>
            <LockGlyph size={12} color={COLORS.textSecondary} />
            <Text style={styles.footerNoteText}>
              Free preview • End-to-end encrypted session
            </Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceBase,
  },
  canvas: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
  },
  modelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  modelStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  modelBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    maxWidth: 130,
  },
  headerNewChatBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },

  // ── Stitch Empty State ───────────────────────────────────────
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  emptyCenterContent: {
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
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 26,
    lineHeight: 22,
  },

  // ── Suggestions ──────────────────────────────────────────────
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

  // ── Bottom Area & Footer ─────────────────────────────────────
  bottomArea: {
    paddingBottom: Platform.OS === 'ios' ? 24 : 16,
    alignItems: 'center',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  footerNoteText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
});