import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EMPTY_RUN_STATE,
  RunState,
  RunStatus,
  StreamResult,
  ToolStep,
  WireMessage,
} from '../types/aiRun';
import { nineRouterClient } from '../services/nineRouterClient';
import {
  AI_TOOL_DEFINITIONS,
  executeAiTool,
  getToolLabel,
  summarizeToolArgs,
} from '../services/aiTools';
import { saveMessage, updateMessage, updateSessionMessageCount } from '../services/history';
import { MessageStatus } from '../types/chat';

/** Interval minimal update state teks, supaya tidak re-render per token. */
const TEXT_FLUSH_MS = 60;
/** Interval tulis balasan parsial ke SQLite. */
const DB_FLUSH_MS = 500;
/** Dianggap error bila tidak ada event apa pun selama ini. */
const INACTIVITY_TIMEOUT_MS = 30000;
/** Batas iterasi agentic loop. */
const MAX_TOOL_ITERATIONS = 6;

export interface AiRunRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  systemPrompt?: string | null;
  /** Riwayat percakapan sebelum run ini, sudah termasuk pesan user terbaru. */
  history: WireMessage[];
  sessionId: string;
  supportsTools: boolean;
  supportsReasoning: boolean;
}

export interface UseAiRunResult {
  runState: RunState;
  /** Teks jawaban yang sedang mengalir (hanya hidup selama run aktif). */
  streamingText: string;
  isRunning: boolean;
  send: (request: AiRunRequest) => Promise<void>;
  stop: () => void;
  clearError: () => void;
}

export const useAiRun = (): UseAiRunResult => {
  const [runState, setRunState] = useState<RunState>(EMPTY_RUN_STATE);
  const [streamingText, setStreamingText] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const mountedRef = useRef(true);
  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const abortedByUserRef = useRef(false);
  const timedOutRef = useRef(false);

  const textBufferRef = useRef('');
  const reasoningBufferRef = useRef('');
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sessionIdRef = useRef<string | null>(null);
  const assistantRowIdRef = useRef<string | null>(null);

  const clearInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const clearStreamTimers = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }
    if (dbTimerRef.current) {
      clearInterval(dbTimerRef.current);
      dbTimerRef.current = null;
    }
    clearInactivityTimer();
  }, [clearInactivityTimer]);

  const setStatus = useCallback((next: RunStatus, error?: string) => {
    setRunState((prev) => {
      if (prev.status === next && prev.error === error) return prev;
      return { ...prev, status: next, error };
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      if (!mountedRef.current) return;
      setStreamingText(textBufferRef.current);
      setRunState((prev) => {
        const nextReasoning = reasoningBufferRef.current;
        if (prev.reasoning === nextReasoning) return prev;
        return { ...prev, reasoning: nextReasoning };
      });
    }, TEXT_FLUSH_MS);
  }, []);

  const armInactivityTimer = useCallback(() => {
    clearInactivityTimer();
    inactivityTimerRef.current = setTimeout(() => {
      timedOutRef.current = true;
      abortRef.current?.abort();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearInactivityTimer]);

  const persistAssistant = useCallback(
    async (content: string, status: MessageStatus): Promise<void> => {
      const sessionId = sessionIdRef.current;
      if (!sessionId || !content.trim()) return;
      try {
        if (!assistantRowIdRef.current) {
          assistantRowIdRef.current = await saveMessage(sessionId, 'assistant', content, status);
        } else {
          await updateMessage(assistantRowIdRef.current, content, status);
        }
      } catch (err) {
        console.error('Gagal menyimpan balasan asisten ke SQLite:', err);
      }
    },
    []
  );

  const stop = useCallback(() => {
    abortedByUserRef.current = true;
    abortRef.current?.abort();
  }, []);

  const clearError = useCallback(() => {
    setRunState((prev) => ({ ...prev, status: 'idle', error: undefined }));
  }, []);

  const send = useCallback(
    async (request: AiRunRequest): Promise<void> => {
      // Hanya boleh ada satu run aktif per percakapan.
      if (runningRef.current) return;

      runningRef.current = true;
      setIsRunning(true);
      abortedByUserRef.current = false;
      timedOutRef.current = false;
      textBufferRef.current = '';
      reasoningBufferRef.current = '';
      assistantRowIdRef.current = null;
      sessionIdRef.current = request.sessionId;

      setStreamingText('');
      setRunState({ status: 'submitted', reasoning: '', steps: [] });

      const controller = new AbortController();
      abortRef.current = controller;

      // Tulis balasan parsial berkala, bukan per token.
      dbTimerRef.current = setInterval(() => {
        persistAssistant(textBufferRef.current, 'streaming');
      }, DB_FLUSH_MS);

      const wireMessages: WireMessage[] = [...request.history];
      const steps: ToolStep[] = [];

      const callModel = (): Promise<{ result: StreamResult | null; error: string | null }> =>
        new Promise((resolve) => {
          let failure: string | null = null;
          nineRouterClient
            .chatStream({
              baseUrl: request.baseUrl,
              apiKey: request.apiKey,
              model: request.model,
              systemPrompt: request.systemPrompt,
              messages: wireMessages,
              // `tools` wajib ikut di setiap request agar router bisa memvalidasi skema.
              tools: request.supportsTools ? AI_TOOL_DEFINITIONS : null,
              reasoningEnabled: request.supportsReasoning,
              signal: controller.signal,
              onToken: (token) => {
                armInactivityTimer();
                textBufferRef.current += token;
                setStatus('streaming');
                scheduleFlush();
              },
              onReasoning: (text) => {
                armInactivityTimer();
                reasoningBufferRef.current += text;
                setStatus('reasoning');
                scheduleFlush();
              },
              onError: (message) => {
                failure = message;
                resolve({ result: null, error: message });
              },
              onComplete: (result) => {
                resolve({ result, error: failure });
              },
            })
            .catch((err: unknown) => {
              const message =
                err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga';
              resolve({ result: null, error: message });
            });
        });

      let finalStatus: MessageStatus = 'done';
      let errorMessage: string | null = null;

      try {
        armInactivityTimer();

        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
          const { result, error } = await callModel();

          if (controller.signal.aborted) {
            errorMessage = timedOutRef.current
              ? `Tidak ada respons dari server selama ${INACTIVITY_TIMEOUT_MS / 1000} detik.`
              : null;
            break;
          }

          if (error || !result) {
            errorMessage = error ?? 'Permintaan gagal diproses.';
            break;
          }

          // Tidak ada tool yang dipanggil -> jawaban selesai.
          if (result.toolCalls.length === 0) {
            break;
          }

          // Ada tool: tampilkan sebagai langkah, jalankan, lalu lanjutkan loop.
          setStatus('tool_running');
          clearInactivityTimer();

          const newSteps: ToolStep[] = result.toolCalls.map((call) => ({
            id: call.id || `${call.function.name}-${Math.random().toString(36).slice(2, 8)}`,
            name: call.function.name,
            args: summarizeToolArgs(call.function.name, call.function.arguments),
            status: 'running',
            label: getToolLabel(call.function.name),
          }));
          steps.push(...newSteps);
          setRunState((prev) => ({ ...prev, steps: [...steps] }));

          // Assistant yang meminta tool harus ikut ke konteks percakapan.
          wireMessages.push({
            role: 'assistant',
            content: result.content || null,
            tool_calls: result.toolCalls.map((call, index) => ({
              ...call,
              id: call.id || newSteps[index]?.id || `call_${index}`,
            })),
          });

          for (let index = 0; index < result.toolCalls.length; index += 1) {
            const call = result.toolCalls[index];
            const step = newSteps[index];

            let output: string;
            let stepStatus: ToolStep['status'] = 'done';
            try {
              output = await executeAiTool(call.function.name, call.function.arguments);
            } catch (toolErr) {
              stepStatus = 'error';
              output = JSON.stringify({
                error: toolErr instanceof Error ? toolErr.message : 'Tool gagal dijalankan.',
              });
            }

            step.status = stepStatus;
            setRunState((prev) => ({ ...prev, steps: [...steps] }));

            wireMessages.push({
              role: 'tool',
              tool_call_id: call.id || step.id,
              content: output,
            });
          }

          if (iteration === MAX_TOOL_ITERATIONS - 1) {
            errorMessage = 'Batas maksimum pemanggilan tool tercapai.';
            break;
          }

          // Kembali menunggu model melanjutkan setelah hasil tool dikirim.
          setStatus('submitted');
          armInactivityTimer();
        }
      } catch (err: unknown) {
        errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga';
      } finally {
        clearStreamTimers();
        runningRef.current = false;
        abortRef.current = null;

        if (errorMessage && !controller.signal.aborted) {
          finalStatus = 'error';
        } else if (controller.signal.aborted && !timedOutRef.current) {
          finalStatus = 'interrupted';
        } else if (timedOutRef.current) {
          finalStatus = 'error';
        }

        const finalText = textBufferRef.current;
        await persistAssistant(finalText, finalStatus);

        if (sessionIdRef.current && finalText.trim()) {
          try {
            await updateSessionMessageCount(sessionIdRef.current);
          } catch (err) {
            console.error('Gagal memperbarui jumlah pesan sesi:', err);
          }
        }

        if (!mountedRef.current) return;

        setStreamingText(finalText);
        setRunState((prev) => ({
          ...prev,
          // Pesan error tetap tampil sebagai banner, sementara semua indikator
          // proses dilepas karena statusnya sudah bukan 'active' lagi.
          status: errorMessage ? 'error' : 'idle',
          error: errorMessage ?? undefined,
        }));
        setIsRunning(false);
      }
    },
    [
      armInactivityTimer,
      clearInactivityTimer,
      clearStreamTimers,
      persistAssistant,
      scheduleFlush,
      setStatus,
    ]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearStreamTimers();
      abortRef.current?.abort();
      abortRef.current = null;
      runningRef.current = false;
    };
  }, [clearStreamTimers]);

  return {
    runState,
    streamingText,
    isRunning,
    send,
    stop,
    clearError,
  };
};
