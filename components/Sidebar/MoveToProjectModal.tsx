import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Project } from '../../types/chat';
import { COLORS } from '../../types/design';
import { CheckGlyph, FolderGlyph } from '../DesignSystem';

interface MoveToProjectModalProps {
  visible: boolean;
  projects: Project[];
  currentProjectId: string | null;
  onClose: () => void;
  onSelect: (projectId: string | null) => void;
}

/**
 * Memindahkan satu percakapan ke project lain, atau melepasnya dari project.
 */
export const MoveToProjectModal: React.FC<MoveToProjectModalProps> = ({
  visible,
  projects,
  currentProjectId,
  onClose,
  onSelect,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Tutup pilihan project"
        />

        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Pindahkan ke project</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => onSelect(null)}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={styles.rowText}>Tanpa project</Text>
              {currentProjectId === null && <CheckGlyph size={16} color={COLORS.accentYellow} />}
            </TouchableOpacity>

            {projects.map((project) => (
              <TouchableOpacity
                key={project.id}
                style={styles.row}
                onPress={() => onSelect(project.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.rowLeft}>
                  <FolderGlyph size={16} color={COLORS.textSecondary} />
                  <Text style={styles.rowText} numberOfLines={1}>
                    {project.name}
                  </Text>
                </View>
                {currentProjectId === project.id && (
                  <CheckGlyph size={16} color={COLORS.accentYellow} />
                )}
              </TouchableOpacity>
            ))}

            {projects.length === 0 && (
              <Text style={styles.emptyText}>
                Belum ada project. Buat project dari menu Projects di sidebar.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  rowText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingHorizontal: 8,
    paddingVertical: 12,
    lineHeight: 18,
  },
});
