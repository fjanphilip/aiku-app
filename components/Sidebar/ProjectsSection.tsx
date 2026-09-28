import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Project } from '../../types/chat';
import { COLORS } from '../../types/design';
import { FolderGlyph, MoreGlyph, PlusGlyph } from '../DesignSystem';

interface ProjectsSectionProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreatePress: () => void;
  onProjectMenu: (project: Project) => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreatePress,
  onProjectMenu,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>PROJECTS</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={onCreatePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          accessibilityLabel="Buat project baru"
        >
          <PlusGlyph size={14} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {activeProjectId !== null && (
        <TouchableOpacity
          style={styles.allRow}
          onPress={() => onSelectProject(null)}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <Text style={styles.allRowText}>Semua percakapan</Text>
        </TouchableOpacity>
      )}

      {projects.map((project) => {
        const isActive = project.id === activeProjectId;
        return (
          <View key={project.id} style={[styles.row, isActive && styles.rowActive]}>
            <TouchableOpacity
              style={styles.rowMain}
              onPress={() => onSelectProject(project.id)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Project ${project.name}`}
            >
              <FolderGlyph
                size={16}
                color={isActive ? COLORS.accentYellow : COLORS.textMuted}
              />
              <Text
                style={[styles.rowText, isActive && styles.rowTextActive]}
                numberOfLines={1}
              >
                {project.name}
              </Text>
              <Text style={styles.count}>{project.sessionCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => onProjectMenu(project)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.65}
              accessibilityLabel={`Aksi untuk project ${project.name}`}
            >
              <MoreGlyph size={14} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        );
      })}

      {projects.length === 0 && (
        <Text style={styles.emptyText}>
          Kelompokkan percakapan dengan membuat project.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  addBtn: {
    padding: 2,
  },
  allRow: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 2,
  },
  allRowText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.accentYellow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: 9,
    paddingLeft: 10,
    paddingRight: 4,
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
  count: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textMuted,
    backgroundColor: COLORS.surfaceContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  moreBtn: {
    paddingVertical: 9,
    paddingHorizontal: 10,
  },
  emptyText: {
    fontSize: 11,
    color: COLORS.textMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    lineHeight: 16,
  },
});
