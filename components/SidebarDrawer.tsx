import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllSessions, deleteSession } from '../services/history';
import { ChatSession } from '../types/chat';
import { COLORS } from '../types/design';
import {
  CloseGlyph,
  PlusGlyph,
  SettingsGlyph,
  LockGlyph,
  TrashGlyph,
  ChatGlyph,
} from './DesignSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 330);

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onOpenSettings: () => void;
  currentSessionId: string | null;
  activeModel?: string;
  isConfigured?: boolean;
}

export const SidebarDrawer: React.FC<SidebarDrawerProps> = ({
  isOpen,
  onClose,
  onNewChat,
  onSelectSession,
  onOpenSettings,
  currentSessionId,
  activeModel = 'gemini-2.0-flash',
  isConfigured = true,
}) => {
  const insets = useSafeAreaInsets();
  const [animValue] = useState(() => new Animated.Value(0));
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  // Animate drawer open/close & load sessions
  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isOpen ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();

    if (isOpen) {
      let isMounted = true;
      getAllSessions()
        .then((data) => {
          if (isMounted) {
            setSessions(data);
          }
        })
        .catch((err) => {
          console.error('Gagal memuat riwayat di sidebar:', err);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, animValue]);

  const refreshHistory = async () => {
    try {
      const data = await getAllSessions();
      setSessions(data);
    } catch (err) {
      console.error('Gagal memuat riwayat di sidebar:', err);
    }
  };

  const handleDeleteSession = (session: ChatSession) => {
    Alert.alert(
      'Hapus Sesi',
      `Hapus percakapan "${session.title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(session.id);
              await refreshHistory();
              if (currentSessionId === session.id) {
                onNewChat();
              }
            } catch (err) {
              console.error('Gagal menghapus sesi:', err);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const translateX = useMemo(
    () =>
      animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-DRAWER_WIDTH, 0],
      }),
    [animValue]
  );

  const backdropOpacity = useMemo(
    () =>
      animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.65],
      }),
    [animValue]
  );

  return (
    <View
      style={[
        styles.overlayContainer,
        { pointerEvents: isOpen ? 'auto' : 'none' },
      ]}
    >
      {/* Dimmed backdrop */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backdropTouch}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Tutup sidebar"
        />
      </Animated.View>

      {/* Slide-in Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_WIDTH,
            paddingTop: Math.max(insets.top, 16) + 8,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Drawer Header: Avatar + Title + Close button */}
        <View style={styles.drawerHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarOrb}>
              <Image
                source={require('../assets/aiku-avatar.jpg')}
                style={styles.avatarImage}
                resizeMode="cover"
              />
              <View style={styles.onlineDot} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.appName}>Aiku</Text>
              <Text style={styles.appSubtitle}>9Router AI Client</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
            accessibilityLabel="Tutup menu"
          >
            <CloseGlyph size={14} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Action: New Chat Button */}
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => {
            onClose();
            onNewChat();
          }}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Mulai percakapan baru"
        >
          <View style={styles.newChatIconWrap}>
            <PlusGlyph size={16} color={COLORS.onAccentYellow} />
          </View>
          <Text style={styles.newChatText}>Chat Baru</Text>
        </TouchableOpacity>

        {/* Section: Riwayat Percakapan */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>RIWAYAT PERCAKAPAN</Text>
            <Text style={styles.sessionCount}>{sessions.length}</Text>
          </View>

          <ScrollView
            style={styles.sessionList}
            contentContainerStyle={styles.sessionListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {sessions.length === 0 ? (
              <View style={styles.emptyHistoryBox}>
                <Text style={styles.emptyHistoryTitle}>Belum ada riwayat</Text>
                <Text style={styles.emptyHistorySubtitle}>
                  Percakapan Anda akan tersimpan otomatis di sini.
                </Text>
              </View>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === currentSessionId;
                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionItem,
                      isActive && styles.sessionItemActive,
                    ]}
                    onPress={() => {
                      onClose();
                      onSelectSession(session.id);
                    }}
                    activeOpacity={0.75}
                  >
                    <View style={styles.sessionItemLeft}>
                      <ChatGlyph
                        size={15}
                        color={isActive ? COLORS.accentYellow : COLORS.textMuted}
                      />
                      <Text
                        style={[
                          styles.sessionTitleText,
                          isActive && styles.sessionTitleTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {session.title}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteSessionBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteSession(session);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.65}
                    >
                      <TrashGlyph size={12} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Drawer Footer: Settings & Connection Info */}
        <View style={styles.drawerFooter}>
          {/* Active Model Pill */}
          <View style={styles.modelStatusPill}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isConfigured ? '#10B981' : '#F59E0B' },
              ]}
            />
            <Text style={styles.modelStatusText} numberOfLines={1}>
              {activeModel}
            </Text>
          </View>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.footerItem}
            onPress={() => {
              onClose();
              onOpenSettings();
            }}
            activeOpacity={0.75}
          >
            <SettingsGlyph size={18} color={COLORS.textSecondary} />
            <Text style={styles.footerItemText}>Pengaturan 9Router</Text>
          </TouchableOpacity>

          {/* Encryption Note */}
          <View style={styles.encryptedNote}>
            <LockGlyph size={11} color={COLORS.textMuted} />
            <Text style={styles.encryptedNoteText}>
              Sesi terenkripsi & tersimpan lokal
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 20,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  backdropTouch: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#161618',
    borderRightWidth: 1,
    borderRightColor: COLORS.borderSubtle,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 24,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 199, 44, 0.4)',
    overflow: 'visible',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#161618',
  },
  headerTexts: {
    justifyContent: 'center',
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  appSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.accentYellow,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginTop: 16,
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  newChatIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(26, 20, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onAccentYellow,
    letterSpacing: -0.2,
  },
  historySection: {
    flex: 1,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  sessionCount: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  sessionList: {
    flex: 1,
  },
  sessionListContent: {
    gap: 4,
    paddingBottom: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  sessionItemActive: {
    backgroundColor: COLORS.accentYellowContainer,
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 44, 0.25)',
  },
  sessionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  sessionTitleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  sessionTitleTextActive: {
    color: COLORS.accentYellow,
    fontWeight: '600',
  },
  deleteSessionBtn: {
    padding: 6,
    borderRadius: 6,
  },
  emptyHistoryBox: {
    paddingVertical: 32,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  emptyHistoryTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptyHistorySubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  loadingBox: {
    gap: 8,
    paddingVertical: 12,
  },
  skeletonItem: {
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  drawerFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
    gap: 10,
  },
  modelStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainer,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  statusIndicator: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  modelStatusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  footerItemText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  encryptedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  encryptedNoteText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});

export default SidebarDrawer;
