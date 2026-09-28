import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatSession, Project } from '../types/chat';
import { COLORS } from '../types/design';
import { useSessionLibrary } from '../hooks/useSessionLibrary';
import { ProjectsSection } from './Sidebar/ProjectsSection';
import { HistorySection } from './Sidebar/HistorySection';
import { ProjectEditorModal } from './Sidebar/ProjectEditorModal';
import { ProjectActionsModal } from './Sidebar/ProjectActionsModal';
import { MoveToProjectModal } from './Sidebar/MoveToProjectModal';
import {
  CloseGlyph,
  PlusGlyph,
  SettingsGlyph,
  LockGlyph,
  SearchGlyph,
} from './DesignSystem';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 330);

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onNewChatInProject: (projectId: string) => void;
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
  onNewChatInProject,
  onSelectSession,
  onOpenSettings,
  currentSessionId,
  activeModel = 'gemini-2.0-flash',
  isConfigured = true,
}) => {
  const insets = useSafeAreaInsets();
  const [animValue] = useState(() => new Animated.Value(0));
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'rename'>('create');
  const [editorProject, setEditorProject] = useState<Project | null>(null);
  const [actionProject, setActionProject] = useState<Project | null>(null);
  const [moveTarget, setMoveTarget] = useState<ChatSession | null>(null);

  const {
    sessions,
    groups,
    projects,
    isLoading,
    query,
    setQuery,
    activeProjectId,
    selectProject,
    removeSession,
    addProject,
    editProject,
    removeProject,
    moveSession,
  } = useSessionLibrary(isOpen);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId]
  );

  // Animasi buka/tutup drawer
  useEffect(() => {
    Animated.timing(animValue, {
      toValue: isOpen ? 1 : 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [isOpen, animValue]);

  // Drawer bisa ditutup dari banyak jalur, jadi state sementara
  // dibersihkan di satu handler alih-alih lewat effect.
  const handleClose = useCallback(() => {
    setIsSearchOpen(false);
    setQuery('');
    setIsEditorVisible(false);
    setActionProject(null);
    setMoveTarget(null);
    onClose();
  }, [onClose, setQuery]);

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

  const handleSelectSession = (sessionId: string) => {
    handleClose();
    onSelectSession(sessionId);
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
              await removeSession(session.id);
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

  const handleDeleteProject = (project: Project) => {
    setActionProject(null);
    Alert.alert(
      'Hapus Project',
      `Hapus project "${project.name}"? Percakapan di dalamnya tetap tersimpan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeProject(project.id);
            } catch (err) {
              console.error('Gagal menghapus project:', err);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleSubmitEditor = async (name: string) => {
    try {
      if (editorMode === 'rename' && editorProject) {
        await editProject(editorProject.id, name);
      } else {
        await addProject(name);
      }
      setIsEditorVisible(false);
    } catch (err) {
      console.error('Gagal menyimpan project:', err);
    }
  };

  const handleMoveSession = async (projectId: string | null) => {
    const target = moveTarget;
    setMoveTarget(null);
    if (!target) return;
    try {
      await moveSession(target.id, projectId);
    } catch (err) {
      console.error('Gagal memindahkan sesi:', err);
    }
  };

  return (
    <>
      <View
        style={[
          styles.overlayContainer,
          { pointerEvents: isOpen ? 'auto' : 'none' },
        ]}
      >
        {/* Dimmed backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={handleClose}
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
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityLabel="Tutup menu"
            >
              <CloseGlyph size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Primary Action: New Chat */}
          <TouchableOpacity
            style={styles.newChatBtn}
            onPress={() => {
              handleClose();
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

          {/* Search: row yang berubah jadi input saat aktif */}
          {isSearchOpen ? (
            <View style={styles.searchBox}>
              <SearchGlyph size={14} color={COLORS.textMuted} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Cari judul percakapan..."
                placeholderTextColor={COLORS.textMuted}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor={COLORS.accentYellow}
                accessibilityLabel="Cari percakapan"
              />
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setIsSearchOpen(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.65}
                accessibilityLabel="Tutup pencarian"
              >
                <CloseGlyph size={12} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.searchRow}
              onPress={() => setIsSearchOpen(true)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Cari percakapan"
            >
              <SearchGlyph size={16} color={COLORS.textSecondary} />
              <Text style={styles.searchRowText}>Cari percakapan</Text>
            </TouchableOpacity>
          )}

          {/* Projects + Riwayat dalam satu area scroll */}
          <ScrollView
            style={styles.middleScroll}
            contentContainerStyle={styles.middleContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ProjectsSection
              projects={projects}
              activeProjectId={activeProjectId}
              onSelectProject={selectProject}
              onCreatePress={() => {
                setEditorMode('create');
                setEditorProject(null);
                setIsEditorVisible(true);
              }}
              onProjectMenu={setActionProject}
            />

            <HistorySection
              groups={groups}
              totalCount={sessions.length}
              activeProject={activeProject}
              currentSessionId={currentSessionId}
              isLoading={isLoading}
              hasQuery={query.trim().length > 0}
              onSelectSession={handleSelectSession}
              onDeleteSession={handleDeleteSession}
              onMoveSession={setMoveTarget}
            />
          </ScrollView>

          {/* Drawer Footer: Settings & Connection Info */}
          <View style={styles.drawerFooter}>
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

            <TouchableOpacity
              style={styles.footerItem}
              onPress={() => {
                handleClose();
                onOpenSettings();
              }}
              activeOpacity={0.75}
            >
              <SettingsGlyph size={18} color={COLORS.textSecondary} />
              <Text style={styles.footerItemText}>Pengaturan 9Router</Text>
            </TouchableOpacity>

            <View style={styles.encryptedNote}>
              <LockGlyph size={11} color={COLORS.textMuted} />
              <Text style={styles.encryptedNoteText}>
                Sesi terenkripsi & tersimpan lokal
              </Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <ProjectEditorModal
        visible={isEditorVisible}
        title={editorMode === 'rename' ? 'Ganti nama project' : 'Project baru'}
        initialValue={editorProject?.name ?? ''}
        submitLabel={editorMode === 'rename' ? 'Simpan' : 'Buat'}
        onCancel={() => setIsEditorVisible(false)}
        onSubmit={handleSubmitEditor}
      />

      <ProjectActionsModal
        visible={actionProject !== null}
        project={actionProject}
        onClose={() => setActionProject(null)}
        onNewChatInProject={(project) => {
          setActionProject(null);
          handleClose();
          onNewChatInProject(project.id);
        }}
        onRename={(project) => {
          setActionProject(null);
          setEditorMode('rename');
          setEditorProject(project);
          setIsEditorVisible(true);
        }}
        onDelete={handleDeleteProject}
      />

      <MoveToProjectModal
        visible={moveTarget !== null}
        projects={projects}
        currentProjectId={moveTarget?.projectId ?? null}
        onClose={() => setMoveTarget(null)}
        onSelect={handleMoveSession}
      />
    </>
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  searchRowText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainer,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
    padding: 0,
  },
  middleScroll: {
    flex: 1,
    marginTop: 4,
  },
  middleContent: {
    paddingBottom: 8,
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
