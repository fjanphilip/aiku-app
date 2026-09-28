import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChatSession, Project } from '../../types/chat';
import { COLORS } from '../../types/design';
import { SessionGroup } from '../../hooks/useSessionLibrary';
import { ChatGlyph, FolderGlyph, TrashGlyph } from '../DesignSystem';

interface HistorySectionProps {
  groups: SessionGroup[];
  totalCount: number;
  activeProject: Project | null;
  currentSessionId: string | null;
  isLoading: boolean;
  hasQuery: boolean;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (session: ChatSession) => void;
  onMoveSession: (session: ChatSession) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  groups,
  totalCount,
  activeProject,
  currentSessionId,
  isLoading,
  hasQuery,
  onSelectSession,
  onDeleteSession,
  onMoveSession,
}) => {
  const sectionTitle = activeProject ? activeProject.name.toUpperCase() : 'RIWAYAT PERCAKAPAN';

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {sectionTitle}
        </Text>
        <Text style={styles.count}>{totalCount}</Text>
      </View>

      <View style={styles.list}>
        {isLoading && totalCount === 0 ? (
          <View style={styles.skeletonBox}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={styles.skeletonItem} />
            ))}
          </View>
        ) : groups.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>
              {hasQuery
                ? 'Tidak ada hasil'
                : activeProject
                  ? 'Project masih kosong'
                  : 'Belum ada riwayat'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {hasQuery
                ? 'Coba kata kunci lain.'
                : activeProject
                  ? 'Pindahkan percakapan ke project ini dari daftar riwayat.'
                  : 'Percakapan Anda akan tersimpan otomatis di sini.'}
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>

              {group.data.map((session) => {
                const isActive = session.id === currentSessionId;
                return (
                  <View key={session.id} style={[styles.row, isActive && styles.rowActive]}>
                    <TouchableOpacity
                      style={styles.rowMain}
                      onPress={() => onSelectSession(session.id)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                    >
                      <ChatGlyph
                        size={15}
                        color={isActive ? COLORS.accentYellow : COLORS.textMuted}
                      />
                      <Text
                        style={[styles.rowText, isActive && styles.rowTextActive]}
                        numberOfLines={1}
                      >
                        {session.title}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rowAction}
                      onPress={() => onMoveSession(session)}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      activeOpacity={0.65}
                      accessibilityLabel={`Pindahkan ${session.title} ke project`}
                    >
                      <FolderGlyph size={13} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rowAction}
                      onPress={() => onDeleteSession(session)}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      activeOpacity={0.65}
                      accessibilityLabel={`Hapus ${session.title}`}
                    >
                      <TrashGlyph size={12} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    flex: 1,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
    gap: 8,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    flexShrink: 1,
  },
  count: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  list: {
    paddingBottom: 16,
  },
  group: {
    marginBottom: 10,
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
    borderRadius: 10,
  },
  rowActive: {
    backgroundColor: COLORS.accentYellowContainer,
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 44, 0.25)',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  rowText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  rowTextActive: {
    color: COLORS.accentYellow,
    fontWeight: '600',
  },
  rowAction: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  skeletonBox: {
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  skeletonItem: {
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
