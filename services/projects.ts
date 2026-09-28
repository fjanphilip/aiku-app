import { Platform } from 'react-native';
import { Project } from '../types/chat';
import {
  getAllSessions,
  runInQueue,
  unassignSessionsFromProject,
} from './history';

const isWeb = Platform.OS === 'web';
const WEB_PROJECTS_KEY = 'ai_chat_web_projects';

const getWebProjects = (): Omit<Project, 'sessionCount'>[] => {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(WEB_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveWebProjects = (projects: Omit<Project, 'sessionCount'>[]): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(WEB_PROJECTS_KEY, JSON.stringify(projects));
};

const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Melampirkan jumlah sesi per project pada jalur web,
 * meniru subquery COUNT yang dipakai di jalur SQLite.
 */
const withSessionCounts = (
  projects: Omit<Project, 'sessionCount'>[],
  sessions: { projectId: string | null }[]
): Project[] =>
  projects.map((project) => ({
    ...project,
    sessionCount: sessions.filter((s) => s.projectId === project.id).length,
  }));

export const getAllProjects = async (): Promise<Project[]> => {
  if (isWeb) {
    const sessions = await getAllSessions();
    return withSessionCounts(getWebProjects(), sessions);
  }

  return await runInQueue(async (db) => {
    return await db.getAllAsync<Project>(
      `SELECT p.id, p.name, p.created_at AS createdAt,
        (SELECT COUNT(*) FROM sessions s WHERE s.project_id = p.id) AS sessionCount
       FROM projects p
       ORDER BY p.created_at ASC`
    );
  });
};

export const createProject = async (name: string): Promise<Project> => {
  const id = generateId();
  const createdAt = new Date().toISOString();
  const trimmed = name.trim();

  if (isWeb) {
    const projects = getWebProjects();
    saveWebProjects([...projects, { id, name: trimmed, createdAt }]);
    return { id, name: trimmed, createdAt, sessionCount: 0 };
  }

  await runInQueue(async (db) => {
    await db.runAsync(
      'INSERT INTO projects (id, name, created_at) VALUES (?, ?, ?)',
      id,
      trimmed,
      createdAt
    );
  });

  return { id, name: trimmed, createdAt, sessionCount: 0 };
};

export const renameProject = async (projectId: string, name: string): Promise<void> => {
  const trimmed = name.trim();

  if (isWeb) {
    const projects = getWebProjects().map((p) =>
      p.id === projectId ? { ...p, name: trimmed } : p
    );
    saveWebProjects(projects);
    return;
  }

  await runInQueue(async (db) => {
    await db.runAsync('UPDATE projects SET name = ? WHERE id = ?', trimmed, projectId);
  });
};

/**
 * Menghapus project tanpa menghapus percakapan di dalamnya.
 * Sesi yang tadinya berada di project ini dikembalikan ke daftar umum.
 */
export const deleteProject = async (projectId: string): Promise<void> => {
  if (isWeb) {
    saveWebProjects(getWebProjects().filter((p) => p.id !== projectId));
    await unassignSessionsFromProject(projectId);
    return;
  }

  await runInQueue(async (db) => {
    await db.runAsync('DELETE FROM projects WHERE id = ?', projectId);
  });
  await unassignSessionsFromProject(projectId);
};
