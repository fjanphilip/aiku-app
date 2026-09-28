import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Project } from '../../types/chat';
import { COLORS } from '../../types/design';
import { EditNoteGlyph, PlusGlyph, TrashGlyph } from '../DesignSystem';

interface ProjectActionsModalProps {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onNewChatInProject: (project: Project) => void;
  onRename: (project: Project) => void;
  onDelete: (project: Project) => void;
}

/**
 * Sheet aksi untuk satu project: mulai chat baru di dalamnya, ganti nama, atau hapus.
 */
export const ProjectActionsModal: React.FC<ProjectActionsModalProps> = ({
  visible,
  project,
  onClose,
  onNewChatInProject,
  onRename,
  onDelete,
}) => {
  if (!project) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Tutup menu project"
        />

        <View style={styles.sheet}>
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {project.name}
          </Text>

          <TouchableOpacity
            style={styles.row}
            onPress={() => onNewChatInProject(project)}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <PlusGlyph size={18} color={COLORS.accentYellow} />
            <Text style={styles.rowText}>Chat baru di project ini</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => onRename(project)}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <EditNoteGlyph size={18} color={COLORS.textSecondary} />
            <Text style={styles.rowText}>Ganti nama</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => onDelete(project)}
            activeOpacity={0.75}
            accessibilityRole="button"
          >
            <TrashGlyph size={16} color={COLORS.error} />
            <Text style={[styles.rowText, styles.rowTextDanger]}>Hapus project</Text>
          </TouchableOpacity>

          <Text style={styles.hint}>
            Menghapus project tidak menghapus percakapan di dalamnya.
          </Text>
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
    gap: 4,
  },
  sheetTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  rowTextDanger: {
    color: COLORS.error,
  },
  hint: {
    fontSize: 11,
    color: COLORS.textMuted,
    paddingHorizontal: 8,
    marginTop: 6,
    lineHeight: 16,
  },
});
