import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { ChatMessage, ChatSession, MessageRole } from '../types/chat';

const DB_NAME = 'ai-chat.db';
const isWeb = Platform.OS === 'web';
const WEB_SESSIONS_KEY = 'ai_chat_web_sessions';
const WEB_MESSAGES_KEY = 'ai_chat_web_messages';

// Helper storage web fallback
const getWebSessions = (): ChatSession[] => {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(WEB_SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveWebSessions = (sessions: ChatSession[]): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(WEB_SESSIONS_KEY, JSON.stringify(sessions));
};

const getWebMessages = (): ChatMessage[] => {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(WEB_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveWebMessages = (messages: ChatMessage[]): void => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(WEB_MESSAGES_KEY, JSON.stringify(messages));
};

// Singleton persistent database instance dan promise inisialisasi
// Menjaga agar native object tidak di-garbage-collected oleh Hermes runtime
let dbInstance: SQLite.SQLiteDatabase | null = null;
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Antrean eksekusi sekuensial untuk mencegah race-condition di native layer Android
let dbQueue: Promise<unknown> = Promise.resolve();

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }

  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        const db = await SQLite.openDatabaseAsync(DB_NAME);
        await db.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL,
            message_count INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
        `);
        dbInstance = db;
        return db;
      } catch (err) {
        dbInitPromise = null;
        throw err;
      }
    })();
  }

  return await dbInitPromise;
};

/**
 * Menjalankan operasi database dalam antrean sekuensial
 * agar tidak terjadi pemanggilan prepared statement secara paralel pada native Android.
 */
const runInQueue = async <T>(operation: (db: SQLite.SQLiteDatabase) => Promise<T>): Promise<T> => {
  const db = await getDatabase();
  const execute = async () => {
    return await operation(db);
  };
  const resultPromise = dbQueue.then(execute, execute);
  dbQueue = resultPromise.catch(() => {});
  return await resultPromise;
};

const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

export const initHistoryDatabase = async (): Promise<void> => {
  if (isWeb) return;
  await getDatabase();
};

export const createNewSession = async (firstPrompt: string): Promise<ChatSession> => {
  const id = generateId();
  const title =
    firstPrompt.trim().length > 35
      ? firstPrompt.trim().substring(0, 35) + '...'
      : firstPrompt.trim();
  const createdAt = new Date().toISOString();

  if (isWeb) {
    const sessions = getWebSessions();
    const newSession: ChatSession = { id, title, createdAt, messageCount: 0 };
    saveWebSessions([newSession, ...sessions]);
    return newSession;
  }

  await runInQueue(async (db) => {
    await db.runAsync(
      'INSERT INTO sessions (id, title, created_at, message_count) VALUES (?, ?, ?, 0)',
      id,
      title,
      createdAt
    );
  });

  return { id, title, createdAt, messageCount: 0 };
};

export const getAllSessions = async (): Promise<ChatSession[]> => {
  if (isWeb) {
    return getWebSessions();
  }
  return await runInQueue(async (db) => {
    const sessions = await db.getAllAsync<ChatSession>(
      'SELECT id, title, created_at AS createdAt, message_count AS messageCount FROM sessions ORDER BY created_at DESC'
    );
    return sessions;
  });
};

export const getMessagesForSession = async (sessionId: string): Promise<ChatMessage[]> => {
  if (isWeb) {
    const all = getWebMessages();
    return all.filter((m) => m.sessionId === sessionId);
  }
  return await runInQueue(async (db) => {
    const messages = await db.getAllAsync<ChatMessage>(
      'SELECT id, session_id AS sessionId, role, content, created_at AS createdAt FROM messages WHERE session_id = ? ORDER BY created_at ASC',
      sessionId
    );
    return messages;
  });
};

export const saveMessage = async (
  sessionId: string,
  role: MessageRole,
  content: string
): Promise<string> => {
  const id = generateId();
  const createdAt = new Date().toISOString();

  if (isWeb) {
    const all = getWebMessages();
    all.push({ id, sessionId, role, content, createdAt });
    saveWebMessages(all);
    return id;
  }

  await runInQueue(async (db) => {
    await db.runAsync(
      'INSERT INTO messages (id, session_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)',
      id,
      sessionId,
      role,
      content,
      createdAt
    );
  });

  return id;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  if (isWeb) {
    const sessions = getWebSessions().filter((s) => s.id !== sessionId);
    saveWebSessions(sessions);
    const messages = getWebMessages().filter((m) => m.sessionId !== sessionId);
    saveWebMessages(messages);
    return;
  }
  await runInQueue(async (db) => {
    await db.runAsync('DELETE FROM messages WHERE session_id = ?', sessionId);
    await db.runAsync('DELETE FROM sessions WHERE id = ?', sessionId);
  });
};

export const renameSession = async (sessionId: string, newTitle: string): Promise<void> => {
  if (isWeb) {
    const sessions = getWebSessions().map((s) =>
      s.id === sessionId ? { ...s, title: newTitle } : s
    );
    saveWebSessions(sessions);
    return;
  }
  await runInQueue(async (db) => {
    await db.runAsync('UPDATE sessions SET title = ? WHERE id = ?', newTitle, sessionId);
  });
};

export const updateSessionMessageCount = async (sessionId: string): Promise<void> => {
  if (isWeb) {
    const messages = getWebMessages().filter((m) => m.sessionId === sessionId);
    const sessions = getWebSessions().map((s) =>
      s.id === sessionId ? { ...s, messageCount: messages.length } : s
    );
    saveWebSessions(sessions);
    return;
  }
  await runInQueue(async (db) => {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM messages WHERE session_id = ?',
      sessionId
    );
    if (result) {
      await db.runAsync('UPDATE sessions SET message_count = ? WHERE id = ?', result.count, sessionId);
    }
  });
};