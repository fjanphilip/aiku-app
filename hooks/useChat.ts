import { useState, useEffect, useRef, useCallback } from 'react';
import { nineRouterClient } from '../services/nineRouterClient';
import { getStoredData } from '../services/storage';
import {
  initHistoryDatabase,
  createNewSession,
  saveMessage,
  updateSessionMessageCount,
  getMessagesForSession,
} from '../services/history';
import { ChatMessage } from '../types/chat';

export interface UseChatResult {
  messages: ChatMessage[];
  inputValue: string;
  setInputValue: (value: string) => void;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  abort: () => void;
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
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const assistantResponseRef = useRef<string>('');

  const refreshActiveModel = useCallback(async () => {
    try {
      const data = await getStoredData();
      setActiveModel(data.defaultModel || 'gemini-2.0-flash');
    } catch (err) {
      console.error('Gagal memperbarui model aktif:', err);
    }
  }, []);

  // Muat preferensi model saat hook dimuat
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
    } catch (err) {
      console.error('Gagal memuat sesi chat:', err);
    }
  }, []);

  const startNewChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setSessionId(null);
    setSessionTitle(null);
    setInputValue('');
    setIsLoading(false);
  }, []);

  const sendMessage = async (content: string) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: trimmedContent,
      createdAt: new Date().toISOString(),
    };

    // Tambahkan user message ke state dan kosongkan input field
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    abortControllerRef.current = new AbortController();
    const ac = abortControllerRef.current;
    assistantResponseRef.current = '';

    // Ambil konfigurasi dari SecureStore via services/storage
    const stored = await getStoredData();
    const { baseUrl, apiKey, defaultModel, systemPrompt } = stored;

    if (!baseUrl || !apiKey) {
      setIsLoading(false);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: 'Base URL atau API Key 9Router belum dikonfigurasi. Silakan atur terlebih dahulu di tab **Pengaturan**.',
          createdAt: new Date().toISOString(),
        },
      ]);
      return;
    }

    try {
      let currentSessionId = sessionId;

      // Jika belum ada sesi aktif, buat sesi baru di SQLite
      if (!currentSessionId) {
        try {
          const newSession = await createNewSession(trimmedContent);
          currentSessionId = newSession.id;
          setSessionId(currentSessionId);
          setSessionTitle(newSession.title);
        } catch (dbErr) {
          console.error('Gagal membuat sesi di SQLite (melanjutkan dengan session memory):', dbErr);
          currentSessionId = generateId();
          setSessionId(currentSessionId);
        }
      }

      // Simpan user message ke database
      try {
        await saveMessage(currentSessionId, 'user', trimmedContent);
      } catch (dbErr) {
        console.error('Gagal menyimpan pesan user ke SQLite:', dbErr);
      }

      const conversationHistory = [...messages, userMessage];
      const assistantMessageId = generateId();

      await nineRouterClient.chatStream({
        baseUrl,
        apiKey,
        model: defaultModel || 'gemini-2.0-flash',
        systemPrompt,
        messages: conversationHistory,
        signal: ac.signal,
        onToken: (tokenContent: string) => {
          assistantResponseRef.current += tokenContent;

          // Update state secara immutable sehingga React 19 memicu re-render
          setMessages((prev) => {
            const lastIndex = prev.length - 1;
            if (lastIndex >= 0 && prev[lastIndex].id === assistantMessageId) {
              const updated = [...prev];
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: assistantResponseRef.current,
              };
              return updated;
            } else {
              return [
                ...prev,
                {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: assistantResponseRef.current,
                  createdAt: new Date().toISOString(),
                },
              ];
            }
          });
        },
        onError: (errorMessage: string) => {
          setIsLoading(false);
          // Jika sudah ada respons sebagian, tambahkan catatan error di bawahnya
          if (assistantResponseRef.current) {
            setMessages((prev) => [
              ...prev,
              {
                id: generateId(),
                role: 'assistant',
                content: `\n\n*[Error: ${errorMessage}]*`,
                createdAt: new Date().toISOString(),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              {
                id: generateId(),
                role: 'assistant',
                content: `[Error] ${errorMessage}`,
                createdAt: new Date().toISOString(),
              },
            ]);
          }
        },
        onComplete: async () => {
          setIsLoading(false);
          const fullResponse = assistantResponseRef.current;
          // SIMPAN BALASAN ASISTEN KE DATABASE SQLITE
          if (currentSessionId && fullResponse.trim()) {
            try {
              await saveMessage(currentSessionId, 'assistant', fullResponse);
              await updateSessionMessageCount(currentSessionId);
            } catch (dbErr) {
              console.error('Gagal menyimpan balasan asisten ke SQLite:', dbErr);
            }
          }
        },
      });
    } catch (err: unknown) {
      setIsLoading(false);
      const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga';
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content: `[Error] ${errMsg}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const abort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    sendMessage,
    abort,
    sessionId,
    sessionTitle,
    setSessionId,
    loadSession,
    startNewChat,
    activeModel,
    refreshActiveModel,
  };
};