import { useState, useEffect, useRef, useCallback } from 'react';
import { getStoredData } from '../services/storage';
import {
  initHistoryDatabase,
  createNewSession,
  saveMessage,
  getMessagesForSession,
} from '../services/history';
import { ChatMessage } from '../types/chat';
import { ModelCapabilities, RunState, WireMessage } from '../types/aiRun';
import { useAiRun } from './useAiRun';

export interface UseChatResult {
  messages: ChatMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  /** Ada satu run AI yang sedang berjalan. */
  isRunning: boolean;
  /** Sumber kebenaran semua indikator status. */
  runState: RunState;
  /** Teks jawaban yang sedang mengalir, hanya hidup selama run aktif. */
  streamingText: string;
  sendMessage: (content: string, capabilities: ModelCapabilities) => Promise<void>;
  stop: () => void;
  retry: (capabilities: ModelCapabilities) => Promise<void>;
  dismissError: () => void;
  sessionId: string | null;
  sessionTitle: string | null;
  setSessionId: (id: string | null) => void;
  loadSession: (sessionId: string) => Promise<void>;
  startNewChat: () => void;
  activeModel: string | null;
  refreshActiveModel: () => Promise<void>;
}

const generateId = (): string => {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useChat = (): UseChatResult => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);

  const {
    runState,
    streamingText,
    isRunning,
    send: sendRun,
    stop: stopRun,
    clearError,
  } = useAiRun();

  const sessionIdRef = useRef<string | null>(null);
  const runningRef = useRef(false);

  const refreshActiveModel = useCallback(async () => {
    try {
      const data = await getStoredData();
      setActiveModel(data.defaultModel || 'gemini-2.0-flash');
    } catch (err) {
      console.error('Gagal memperbarui model aktif:', err);
    }
  }, []);

  useEffect(() => {
    initHistoryDatabase().catch((err) => {
      console.warn('Inisialisasi database awal ditunda:', err);
    });
    refreshActiveModel();
  }, [refreshActiveModel]);

  const loadSession = useCallback(async (targetSessionId: string) => {
    try {
      const dbMessages = await getMessagesForSession(targetSessionId);
      setMessages(dbMessages);
      setSessionId(targetSessionId);
      sessionIdRef.current = targetSessionId;
    } catch (err) {
      console.error('Gagal memuat sesi chat:', err);
    }
  }, []);

  const startNewChat = useCallback(() => {
    stopRun();
    runningRef.current = false;
    setMessages([]);
    setSessionId(null);
    sessionIdRef.current = null;
    setSessionTitle(null);
    setInputValue('');
  }, [stopRun]);

  /** Menjalankan satu run AI untuk percakapan yang diberikan. */
  const runConversation = async (
    history: ChatMessage[],
    targetSessionId: string,
    capabilities: ModelCapabilities
  ): Promise<void> => {
    const stored = await getStoredData();
    const { baseUrl, apiKey, defaultModel, systemPrompt } = stored;

    if (!baseUrl || !apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content:
            'Base URL atau API Key belum dikonfigurasi. Silakan atur terlebih dahulu di Pengaturan.',
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    const wireHistory: WireMessage[] = history.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    try {
      await sendRun({
        baseUrl,
        apiKey,
        model: defaultModel || 'gemini-2.0-flash',
        systemPrompt,
        history: wireHistory,
        sessionId: targetSessionId,
        supportsTools: capabilities.supportsTools,
        supportsReasoning: capabilities.supportsReasoning,
      });
    } finally {
      // Muat ulang dari SQLite supaya keadaan idle benar-benar sama
      // dengan isi database (pesan final asisten sudah tersimpan di sana).
      try {
        const dbMessages = await getMessagesForSession(targetSessionId);
        setMessages(dbMessages);
      } catch (err) {
        console.error('Gagal memuat ulang sesi setelah run:', err);
      }
    }
  };

  const sendMessage = async (
    content: string,
    capabilities: ModelCapabilities
  ): Promise<void> => {
    const trimmedContent = content.trim();
    // Hanya satu run aktif per percakapan.
    if (!trimmedContent || runningRef.current) return;

    runningRef.current = true;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmedContent,
      createdAt: new Date().toISOString(),
    };

    const history = [...messages, userMessage];
    setMessages(history);
    setInputValue('');

    try {
      let currentSessionId = sessionIdRef.current;

      if (!currentSessionId) {
        try {
          const newSession = await createNewSession(trimmedContent);
          currentSessionId = newSession.id;
          setSessionTitle(newSession.title);
        } catch (dbErr) {
          console.error('Gagal membuat sesi di SQLite:', dbErr);
          currentSessionId = generateId();
        }
        setSessionId(currentSessionId);
        sessionIdRef.current = currentSessionId;
      }

      // Pesan user disimpan SEBELUM request dikirim.
      try {
        await saveMessage(currentSessionId, 'user', trimmedContent);
      } catch (dbErr) {
        console.error('Gagal menyimpan pesan user ke SQLite:', dbErr);
      }

      await runConversation(history, currentSessionId, capabilities);
    } finally {
      runningRef.current = false;
    }
  };

  /** Mengulang permintaan terakhir tanpa menambah pesan user baru. */
  const retry = async (capabilities: ModelCapabilities): Promise<void> => {
    const targetSessionId = sessionIdRef.current;
    if (!targetSessionId || runningRef.current) return;
    if (!messages.some((message) => message.role === 'user')) return;

    runningRef.current = true;
    clearError();

    // Buang balasan gagal terakhir agar tidak ikut jadi konteks.
    const lastIndex = messages.length - 1;
    const history =
      lastIndex >= 0 &&
      messages[lastIndex].role === 'assistant' &&
      messages[lastIndex].status === 'error'
        ? messages.slice(0, lastIndex)
        : messages;

    try {
      await runConversation(history, targetSessionId, capabilities);
    } finally {
      runningRef.current = false;
    }
  };

  const stop = useCallback(() => {
    stopRun();
  }, [stopRun]);

  return {
    messages,
    inputValue,
    setInputValue,
    isRunning,
    runState,
    streamingText,
    sendMessage,
    stop,
    retry,
    dismissError: clearError,
    sessionId,
    sessionTitle,
    setSessionId,
    loadSession,
    startNewChat,
    activeModel,
    refreshActiveModel,
  };
};
