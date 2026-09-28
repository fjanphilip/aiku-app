import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChat } from '../../hooks/useChat';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useModels, resolveModelCapabilities } from '../../hooks/useModels';
import { ChatBubble } from '../../components/ChatBubble';
import { ChatInput } from '../../components/ChatInput';
import { EmptyState } from '../../components/EmptyState';
import { ModelPickerModal } from '../../components/ModelPickerModal';
import { SidebarDrawer } from '../../components/SidebarDrawer';
import { AssistantRunView } from '../../components/chat/status';
import { ChatMessage } from '../../types/chat';
import { COLORS } from '../../types/design';
import { assignSessionToProject } from '../../services/history';
import { saveDefaultModel } from '../../services/storage';
import {
  GradientMeshBackground,
  LockGlyph,
  HamburgerGlyph,
  PlusGlyph,
} from '../../components/DesignSystem';

/** Opsi tampilan: simpan ringkasan langkah tool setelah run selesai. */
const KEEP_STEPS_AFTER_DONE = false;

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboard();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);

  const {
    messages,
    inputValue,
    setInputValue,
    isRunning,
    runState,
    streamingText,
    sendMessage,
    stop,
    retry,
    loadSession,
    startNewChat,
    activeModel,
    sessionId,
    refreshActiveModel,
  } = useChat();

  const {
    models,
    isLoading: isModelsLoading,
    error: modelsError,
    load: loadModels,
  } = useModels();

  // Capability model aktif diturunkan dari data /v1/models.
  const capabilities = useMemo(
    () => resolveModelCapabilities(models, activeModel),
    [models, activeModel]
  );

  const params = useLocalSearchParams<{ sessionId?: string }>();
  const flatListRef = useRef<FlatList<ChatMessage> | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshActiveModel();
    }, [refreshActiveModel])
  );

  // Daftar model diambil sekali agar capability model aktif diketahui
  // sebelum request pertama dikirim.
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (params.sessionId && params.sessionId !== sessionId) {
      loadSession(params.sessionId);
    }
  }, [params.sessionId, sessionId, loadSession]);

  // Sesi baru yang dimulai dari sebuah project ditautkan begitu id-nya terbuat.
  useEffect(() => {
    if (!sessionId || !pendingProjectId) return;
    let cancelled = false;
    assignSessionToProject(sessionId, pendingProjectId)
      .catch((err) => {
        console.error('Gagal menautkan sesi ke project:', err);
      })
      .finally(() => {
        if (!cancelled) setPendingProjectId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, pendingProjectId]);

  useEffect(() => {
    if (messages.length > 0 || isRunning) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [messages, isRunning, runState.status]);

  const handleSend = () => {
    if (!inputValue.trim() || isRunning) return;
    sendMessage(inputValue, capabilities);
  };

  const handleRetry = () => {
    if (isRunning) return;
    retry(capabilities);
  };

  const handleNewChat = () => {
    setPendingProjectId(null);
    startNewChat();
  };

  const handleNewChatInProject = (projectId: string) => {
    startNewChat();
    setPendingProjectId(projectId);
  };

  const handleOpenModelPicker = () => {
    setIsModelPickerOpen(true);
    loadModels();
  };

  const handleSelectModel = async (modelId: string) => {
    try {
      await saveDefaultModel(modelId);
      await refreshActiveModel();
    } catch (err) {
      console.error('Gagal menyimpan model aktif:', err);
    } finally {
      setIsModelPickerOpen(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior='padding'>
      <View style={styles.canvas}>
        <GradientMeshBackground />

        {/* Left Sidebar Drawer */}
        <SidebarDrawer
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNewChat={handleNewChat}
          onNewChatInProject={handleNewChatInProject}
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
                onPress={handleOpenModelPicker}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                activeOpacity={0.75}
                accessibilityLabel={`Model aktif: ${activeModel}. Ketuk untuk mengganti model.`}
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
            onPress={handleNewChat}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Percakapan baru"
            activeOpacity={0.75}
          >
            <PlusGlyph size={18} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Conversation List or Welcome State */}
        {messages.length === 0 && !isRunning ? (
          <EmptyState onSelectPrompt={setInputValue} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={({ item, index }) => (
              <ChatBubble
                message={item}
                isStreaming={
                  isRunning && index === messages.length - 1 && item.role === 'assistant'
                }
              />
            )}
            keyExtractor={(item) => item.id}
            style={styles.chatList}
            contentContainerStyle={styles.chatListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              <AssistantRunView
                runState={runState}
                streamingText={streamingText}
                keepStepsAfterDone={KEEP_STEPS_AFTER_DONE}
                onRetry={runState.status === 'error' ? handleRetry : undefined}
              />
            }
          />
        )}

        {/* Bottom Chat Bar & Encryption Footnote */}
        <View
          style={[
            styles.bottomArea,
            {
              paddingBottom: keyboard.visible
                ? Platform.OS === 'ios'
                  ? 8
                  : 6
                : Platform.OS === 'ios'
                  ? 24
                  : 16,
            },
          ]}
        >
          <ChatInput
            value={inputValue}
            onChangeText={setInputValue}
            onSend={handleSend}
            onAbort={stop}
            isLoading={isRunning}
            placeholder="Ask me anything..."
            activeModel={activeModel}
            onPressModel={handleOpenModelPicker}
          />

          <View style={styles.footerNote}>
            <LockGlyph size={12} color={COLORS.textSecondary} />
            <Text style={styles.footerNoteText}>
              Free preview • End-to-end encrypted session
            </Text>
          </View>
        </View>

        <ModelPickerModal
          visible={isModelPickerOpen}
          models={models}
          activeModel={activeModel}
          isLoading={isModelsLoading}
          error={modelsError}
          onClose={() => setIsModelPickerOpen(false)}
          onSelect={handleSelectModel}
          onRefresh={() => loadModels(true)}
        />
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
