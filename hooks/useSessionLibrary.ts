import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatSession, Project } from '../types/chat';
import { assignSessionToProject, deleteSession, getAllSessions } from '../services/history';
import {
  createProject,
  deleteProject,
  getAllProjects,
  renameProject,
} from '../services/projects';

export type SessionGroupLabel = 'Today' | 'Yesterday' | 'Earlier';

export interface SessionGroup {
  label: SessionGroupLabel;
  data: ChatSession[];
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date): number =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Mengelompokkan sesi berdasarkan aktivitas terakhirnya (updatedAt)
 * menjadi Today / Yesterday / Earlier. Grup kosong tidak ditampilkan.
 */
export const groupSessionsByDate = (
  sessions: ChatSession[],
  now: Date = new Date()
): SessionGroup[] => {
  const today = startOfDay(now);
  const yesterday = today - DAY_IN_MS;

  const groups: SessionGroup[] = [
    { label: 'Today', data: [] },
    { label: 'Yesterday', data: [] },
    { label: 'Earlier', data: [] },
  ];

  sessions.forEach((session) => {
    const timestamp = new Date(session.updatedAt || session.createdAt).getTime();
    if (Number.isNaN(timestamp) || timestamp < yesterday) {
      groups[2].data.push(session);
    } else if (timestamp >= today) {
      groups[0].data.push(session);
    } else {
      groups[1].data.push(session);
    }
  });

  return groups.filter((group) => group.data.length > 0);
};

/**
 * Satu sumber kebenaran untuk daftar sesi + project di sidebar.
 * Memuat ulang saat drawer dibuka, dan menjaga daftar tetap sinkron
 * setelah aksi hapus / pindah project.
 */
export const useSessionLibrary = (isActive: boolean) => {
  const [allSessions, setAllSessions] = useState<ChatSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessions, nextProjects] = await Promise.all([getAllSessions(), getAllProjects()]);
      setAllSessions(sessions);
      setProjects(nextProjects);
    } catch (err) {
      console.error('Gagal memuat daftar sesi:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      refresh();
    }
  }, [isActive, refresh]);

  const sessions = useMemo(() => {
    const scoped = activeProjectId
      ? allSessions.filter((session) => session.projectId === activeProjectId)
      : allSessions;
    const needle = query.trim().toLowerCase();
    if (!needle) return scoped;
    return scoped.filter((session) => session.title.toLowerCase().includes(needle));
  }, [allSessions, activeProjectId, query]);

  const groups = useMemo(() => groupSessionsByDate(sessions), [sessions]);

  /** Tap project yang sama akan melepas filter. */
  const selectProject = useCallback((projectId: string | null) => {
    setActiveProjectId((current) => (current === projectId ? null : projectId));
  }, []);

  const removeSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    setAllSessions((prev) => prev.filter((session) => session.id !== sessionId));
    setProjects(await getAllProjects());
  }, []);

  const addProject = useCallback(async (name: string) => {
    const project = await createProject(name);
    setProjects((prev) => [...prev, project]);
    return project;
  }, []);

  const editProject = useCallback(async (projectId: string, name: string) => {
    await renameProject(projectId, name);
    setProjects((prev) =>
      prev.map((project) => (project.id === projectId ? { ...project, name } : project))
    );
  }, []);

  const removeProject = useCallback(async (projectId: string) => {
    await deleteProject(projectId);
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
    setAllSessions((prev) =>
      prev.map((session) =>
        session.projectId === projectId ? { ...session, projectId: null } : session
      )
    );
    setActiveProjectId((current) => (current === projectId ? null : current));
  }, []);

  const moveSession = useCallback(async (sessionId: string, projectId: string | null) => {
    await assignSessionToProject(sessionId, projectId);
    setAllSessions((prev) =>
      prev.map((session) => (session.id === sessionId ? { ...session, projectId } : session))
    );
    setProjects(await getAllProjects());
  }, []);

  return {
    sessions,
    groups,
    projects,
    isLoading,
    query,
    setQuery,
    activeProjectId,
    selectProject,
    refresh,
    removeSession,
    addProject,
    editProject,
    removeProject,
    moveSession,
  };
};
