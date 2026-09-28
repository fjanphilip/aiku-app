import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';
import { ChatMessage, ChatSession, MessageRole, MessageStatus } from '../types/chat';

const DB_NAME = 'ai-chat.db';
const isWeb = Platform.OS === 'web';
const WEB_SESSIONS_KEY = 'ai_chat_web_sessions';
const WEB_MESSAGES_KEY = 'ai_chat_web_messages';

// Helper storage web fallback
const normalizeWebSession = (session: ChatSession): ChatSession => ({
  ...session,
  updatedAt: session.updatedAt ?? session.createdAt,
  projectId: session.projectId ?? null,
});

const getWebSessions = (): ChatSession[] => {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(WEB_SESSIONS_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatSession[]) : [];
    return parsed.map(normalizeWebSession);
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

/**
 * Menambahkan kolom ke sebuah tabel hanya jika belum ada.
 * Diperlukan agar database dari versi sebelumnya tetap kompatibel
 * tanpa menghapus data pengguna.
 */
const ensureColumn = async (
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
): Promise<void> => {
  const columns = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

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
            updated_at TEXT,
            message_count INTEGER DEFAULT 0,
            project_id TEXT
          );

          CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT,
            FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
        `);

        // Migrasi database lama: kolom baru ditambahkan hanya bila belum ada.
        // Wajib berjalan SEBELUM index yang memakai kolom tersebut: pada database
        // lama kolomnya belum ada, sehingga CREATE INDEX akan menggagalkan seluruh
        // inisialisasi dan semua operasi database ikut error.
        await ensureColumn(db, 'sessions', 'updated_at', 'TEXT');
        await ensureColumn(db, 'sessions', 'project_id', 'TEXT');
        await ensureColumn(db, 'messages', 'status', 'TEXT');

        await db.execAsync(`
          CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id);
          UPDATE sessions SET updated_at = created_at WHERE updated_at IS NULL;
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
export const runInQueue = async <T>(
  operation: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> => {
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
    const newSession: ChatSession = {
      id,
      title,
      createdAt,
      updatedAt: createdAt,
      messageCount: 0,
      projectId: null,
    };
    saveWebSessions([newSession, ...sessions]);
    return newSession;
  }

  await runInQueue(async (db) => {
    await db.runAsync(
      'INSERT INTO sessions (id, title, created_at, updated_at, message_count, project_id) VALUES (?, ?, ?, ?, 0, NULL)',
      id,
      title,
      createdAt,
      createdAt
    );
  });

  return { id, title, createdAt, updatedAt: createdAt, messageCount: 0, projectId: null };
};

export const getAllSessions = async (): Promise<ChatSession[]> => {
  if (isWeb) {
    return getWebSessions().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }
  return await runInQueue(async (db) => {
    const sessions = await db.getAllAsync<ChatSession>(
      'SELECT id, title, created_at AS createdAt, updated_at AS updatedAt, message_count AS messageCount, project_id AS projectId FROM sessions ORDER BY updated_at DESC'
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
      'SELECT id, session_id AS sessionId, role, content, created_at AS createdAt, status FROM messages WHERE session_id = ? ORDER BY created_at ASC',
      sessionId
    );
    return messages;
  });
};

export const saveMessage = async (
  sessionId: string,
  role: MessageRole,
  content: string,
  status?: MessageStatus
): Promise<string> => {
  const id = generateId();
  const createdAt = new Date().toISOString();

  if (isWeb) {
    const all = getWebMessages();
    all.push({ id, sessionId, role, content, createdAt, status });
    saveWebMessages(all);
    const sessions = getWebSessions().map((s) =>
      s.id === sessionId ? { ...s, updatedAt: createdAt } : s
    );
    saveWebSessions(sessions);
    return id;
  }

  await runInQueue(async (db) => {
    await db.runAsync(
      'INSERT INTO messages (id, session_id, role, content, created_at, status) VALUES (?, ?, ?, ?, ?, ?)',
      id,
      sessionId,
      role,
      content,
      createdAt,
      status ?? null
    );
    // Aktivitas terakhir sesi dipakai untuk mengelompokkan riwayat.
    await db.runAsync('UPDATE sessions SET updated_at = ? WHERE id = ?', createdAt, sessionId);
  });

  return id;
};

/**
 * Menulis ulang isi + status sebuah pesan.
 * Saat streaming, satu baris assistant dibuat berstatus 'streaming', diperbarui
 * berkala (bukan per token), lalu difinalkan ke 'done' / 'interrupted' / 'error'.
 */
export const updateMessage = async (
  messageId: string,
  content: string,
  status: MessageStatus
): Promise<void> => {
  if (isWeb) {
    const all = getWebMessages().map((m) =>
      m.id === messageId ? { ...m, content, status } : m
    );
    saveWebMessages(all);
    return;
  }

  await runInQueue(async (db) => {
    await db.runAsync(
      'UPDATE messages SET content = ?, status = ? WHERE id = ?',
      content,
      status,
      messageId
    );
  });
};

export interface HistorySearchHit {
  sessionId: string;
  sessionTitle: string;
  role: string;
  snippet: string;
}

/**
 * Mencari potongan pesan berdasarkan isi teks. Read-only, tidak mengubah skema.
 * Dipakai sebagai sumber data tool lokal `search_history`.
 */
export const searchMessages = async (
  query: string,
  limit = 8
): Promise<HistorySearchHit[]> => {
  const needle = query.trim();
  if (!needle) return [];

  if (isWeb) {
    const titles = new Map(getWebSessions().map((s) => [s.id, s.title]));
    return getWebMessages()
      .filter((m) => m.content.toLowerCase().includes(needle.toLowerCase()))
      .slice(0, limit)
      .map((m) => ({
        sessionId: m.sessionId ?? '',
        sessionTitle: titles.get(m.sessionId ?? '') ?? 'Tanpa judul',
        role: m.role,
        snippet: m.content.slice(0, 240),
      }));
  }

  return await runInQueue(async (db) => {
    return await db.getAllAsync<HistorySearchHit>(
      `SELECT m.session_id AS sessionId,
              COALESCE(s.title, 'Tanpa judul') AS sessionTitle,
              m.role AS role,
              SUBSTR(m.content, 1, 240) AS snippet
       FROM messages m
       LEFT JOIN sessions s ON s.id = m.session_id
       WHERE m.content LIKE ?
       ORDER BY m.created_at DESC
       LIMIT ?`,
      `%${needle}%`,
      limit
    );
  });
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

export const assignSessionToProject = async (
  sessionId: string,
  projectId: string | null
): Promise<void> => {
  if (isWeb) {
    const sessions = getWebSessions().map((s) =>
      s.id === sessionId ? { ...s, projectId } : s
    );
    saveWebSessions(sessions);
    return;
  }
  await runInQueue(async (db) => {
    await db.runAsync('UPDATE sessions SET project_id = ? WHERE id = ?', projectId, sessionId);
  });
};

export const unassignSessionsFromProject = async (projectId: string): Promise<void> => {
  if (isWeb) {
    const sessions = getWebSessions().map((s) =>
      s.projectId === projectId ? { ...s, projectId: null } : s
    );
    saveWebSessions(sessions);
    return;
  }
  await runInQueue(async (db) => {
    await db.runAsync('UPDATE sessions SET project_id = NULL WHERE project_id = ?', projectId);
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
