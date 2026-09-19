import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { initHistoryDatabase, getAllSessions, deleteSession } from '../../services/history';
import { ChatSession } from '../../types/chat';
import { COLORS } from '../../types/design';
import {
  Screen,
  GradientMeshBackground,
  TrashGlyph,
  HistoryGlyph,
  BackChevronGlyph,
  ChatGlyph,
  PlusGlyph,
} from '../../components/DesignSystem';

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      await initHistoryDatabase();
      const sessionsData = await getAllSessions();
      setSessions(sessionsData);
    } catch (err) {
      console.error('Gagal memuat riwayat sesi:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions])
  );

  const handleSessionPress = (session: ChatSession) => {
    router.navigate({
      pathname: '/(tabs)',
      params: { sessionId: session.id },
    });
  };

  const handleDeleteSession = (session: ChatSession) => {
    Alert.alert(
      'Hapus Sesi',
      `Apakah Anda yakin ingin menghapus percakapan "${session.title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSession(session.id);
              await loadSessions();
            } catch (err) {
              console.error('Gagal menghapus sesi:', err);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const renderSessionItem = ({ item }: { item: ChatSession }) => {
    const formattedDate = formatDate(item.createdAt);

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleSessionPress(item)}
        activeOpacity={0.78}
        accessibilityRole="button"
        accessibilityLabel={`Sesi ${item.title}`}
      >
        <View style={styles.sessionIconWrapper}>
          <ChatGlyph size={16} color={COLORS.accentYellow} />
        </View>

        <View style={styles.sessionContent}>
          <Text style={styles.sessionTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.sessionMetaRow}>
            <View style={styles.messageCountPill}>
              <Text style={styles.messageCountText}>
                {item.messageCount || 0} pesan
              </Text>
            </View>
            {formattedDate ? (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.sessionMetaDate}>{formattedDate}</Text>
              </>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteSession(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={`Hapus ${item.title}`}
          activeOpacity={0.7}
        >
          <TrashGlyph size={14} color="#EF4444" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <Screen>
      <GradientMeshBackground />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.navigate('/(tabs)')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Kembali ke chat"
          activeOpacity={0.75}
        >
          <BackChevronGlyph size={15} color={COLORS.textSecondary} />
          <Text style={styles.backBtnText}>Kembali ke Chat</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Riwayat Percakapan</Text>
        <Text style={styles.headerSubtitle}>
          Daftar sesi chat yang tersimpan secara lokal di perangkat Anda.
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3, 4].map((key) => (
            <View key={key} style={styles.skeletonCard}>
              <View style={styles.skeletonIcon} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonMeta} />
              </View>
            </View>
          ))}
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyOrbWrapper}>
            <View style={styles.emptyOrbGlow} />
            <View style={styles.emptyOrb}>
              <HistoryGlyph size={28} color={COLORS.accentYellow} />
            </View>
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
          <Text style={styles.emptyText}>
            Semua percakapan Anda akan otomatis tersimpan di sini. Mulai obrolan dengan Aiku sekarang.
          </Text>
          <TouchableOpacity
            style={styles.newChatEmptyBtn}
            onPress={() => router.navigate('/(tabs)')}
            activeOpacity={0.82}
          >
            <PlusGlyph size={16} color={COLORS.onAccentYellow} />
            <Text style={styles.newChatEmptyBtnText}>Mulai Chat Baru</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceContainer,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1b1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A292E',
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  skeletonIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonTitle: {
    width: '70%',
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  skeletonMeta: {
    width: '35%',
    height: 10,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    paddingBottom: 60,
  },
  emptyOrbWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyOrbGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 199, 44, 0.12)',
  },
  emptyOrb: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 199, 44, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 44, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    maxWidth: 300,
  },
  newChatEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.accentYellow,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: COLORS.accentYellow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  newChatEmptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onAccentYellow,
    letterSpacing: -0.2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1b1e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A292E',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 199, 44, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 44, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionContent: {
    flex: 1,
    marginRight: 8,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 5,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  messageCountPill: {
    backgroundColor: 'rgba(255, 199, 44, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  messageCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentYellow,
  },
  sessionMetaDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metaDot: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});