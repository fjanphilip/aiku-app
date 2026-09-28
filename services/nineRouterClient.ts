import { fetch } from 'expo/fetch';
import { ModelItem } from '../types/chat';
import { StreamResult, ToolDefinition, WireMessage } from '../types/aiRun';
import { applySseLine, createStreamAccumulator, toStreamResult } from './streamParser';

export interface ChatStreamOptions {
  baseUrl: string;
  apiKey: string;
  model?: string | null;
  systemPrompt?: string | null;
  messages: WireMessage[];
  /** Hanya dikirim bila model mendukung tool calling. */
  tools?: ToolDefinition[] | null;
  /** Hanya dikirim bila model mendukung reasoning. */
  reasoningEnabled?: boolean;
  onToken: (content: string) => void;
  onReasoning?: (text: string) => void;
  onError: (errorMessage: string) => void;
  onComplete: (result: StreamResult) => void;
  signal?: AbortSignal;
}

export const cleanBaseUrl = (url: string): string => {
  return url.trim().replace(/\/+$/, '');
};

export const nineRouterClient = {
  /**
   * Mengirim chat completions dengan streaming SSE.
   *
   * Memakai `fetch` dari `expo/fetch` karena fetch bawaan React Native tidak
   * menyediakan ReadableStream pada response body. Penguraian SSE-nya sendiri
   * ada di services/streamParser.ts supaya bisa diuji terpisah.
   */
  async chatStream(options: ChatStreamOptions): Promise<void> {
    const {
      baseUrl,
      apiKey,
      model,
      systemPrompt,
      messages,
      tools,
      reasoningEnabled,
      onToken,
      onReasoning,
      onError,
      onComplete,
      signal,
    } = options;

    const trimmedBaseUrl = cleanBaseUrl(baseUrl || '');
    const trimmedApiKey = (apiKey || '').trim();

    if (!trimmedBaseUrl || !trimmedApiKey) {
      onError('Base URL atau API Key belum dikonfigurasi di Pengaturan.');
      return;
    }

    const effectiveModel = model && model.trim() ? model.trim() : 'gemini-2.0-flash';

    // Susun payload messages sesuai format OpenAI.
    const formattedMessages: WireMessage[] = [];

    const hasSystem = messages.some((msg) => msg.role === 'system');
    if (systemPrompt && systemPrompt.trim() && !hasSystem) {
      formattedMessages.push({ role: 'system', content: systemPrompt.trim() });
    }

    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
        ...(msg.tool_calls ? { tool_calls: msg.tool_calls } : {}),
        ...(msg.tool_call_id ? { tool_call_id: msg.tool_call_id } : {}),
      });
    }

    const requestBody: Record<string, unknown> = {
      model: effectiveModel,
      messages: formattedMessages,
      stream: true,
    };

    // `tools` harus ikut di setiap request agar router bisa memvalidasi skema.
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }
    if (reasoningEnabled) {
      requestBody.reasoning = { enabled: true };
    }

    const accumulator = createStreamAccumulator();
    let finished = false;

    const finishOnce = () => {
      if (finished) return;
      finished = true;
      onComplete(toStreamResult(accumulator));
    };

    const forward = (line: string) => {
      const delta = applySseLine(accumulator, line);
      if (delta?.content) onToken(delta.content);
      if (delta?.reasoning) onReasoning?.(delta.reasoning);
      return accumulator.done;
    };

    try {
      const response = await fetch(`${trimmedBaseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${trimmedApiKey}`,
          'User-Agent': 'opencode/1.0.0',
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!response.ok) {
        let errorDetails = '';
        try {
          const errText = await response.text();
          try {
            const errJson = JSON.parse(errText);
            errorDetails = errJson.error?.message || errJson.message || errText;
          } catch {
            errorDetails = errText;
          }
        } catch {
          errorDetails = response.statusText;
        }

        if (response.status === 401) {
          onError('API Key tidak valid atau sudah kedaluwarsa (401). Periksa di Pengaturan.');
        } else if (response.status === 402) {
          onError('Kredit provider habis (402). Isi ulang saldo atau pilih model lain.');
        } else if (response.status === 403) {
          onError(`Akses ditolak (403): ${errorDetails}`);
        } else if (response.status === 404) {
          onError(`Endpoint tidak ditemukan (404). Periksa Base URL (${trimmedBaseUrl}).`);
        } else if (response.status === 429) {
          onError('Terlalu banyak permintaan (429). Tunggu sebentar lalu coba lagi.');
        } else if (
          errorDetails.includes('end of life') ||
          errorDetails.includes('no longer available') ||
          errorDetails.includes('Gone') ||
          errorDetails.includes('410')
        ) {
          onError('Model ini sudah tidak tersedia (End of Life). Pilih model lain di Pengaturan.');
        } else {
          onError(`Error ${response.status}: ${errorDetails || 'Permintaan gagal diproses'}`);
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('Gagal membuka streaming response.');
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (forward(line)) {
            finishOnce();
            return;
          }
        }
      }

      // Stream habis tanpa penanda [DONE]: proses sisa baris di buffer.
      if (buffer.trim()) {
        forward(buffer);
      }
      finishOnce();
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || signal?.aborted)) {
        onError('Dihentikan oleh pengguna.');
      } else {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi';
        onError(`Koneksi error: ${message}`);
      }
    }
  },

  /**
   * Mengambil daftar model beserta capability-nya (GET /v1/models).
   */
  async getModels(baseUrl: string, apiKey: string, signal?: AbortSignal): Promise<ModelItem[]> {
    const trimmedBaseUrl = cleanBaseUrl(baseUrl || '');
    const trimmedApiKey = (apiKey || '').trim();

    if (!trimmedBaseUrl || !trimmedApiKey) {
      throw new Error('Base URL dan API Key harus diisi terlebih dahulu.');
    }

    const response = await fetch(`${trimmedBaseUrl}/v1/models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${trimmedApiKey}`,
      },
      signal,
    });

    if (!response.ok) {
      let errText = '';
      try {
        errText = await response.text();
      } catch {
        errText = response.statusText;
      }
      throw new Error(`Gagal mengambil model (${response.status}): ${errText}`);
    }

    const data = await response.json();
    if (Array.isArray(data.data)) {
      return data.data as ModelItem[];
    } else if (Array.isArray(data)) {
      return data as ModelItem[];
    }
    return [];
  },

  /**
   * Menguji koneksi dan memvalidasi kredensial.
   */
  async testConnection(
    baseUrl: string,
    apiKey: string,
    signal?: AbortSignal
  ): Promise<{ success: boolean; message: string; models: ModelItem[] }> {
    try {
      const models = await this.getModels(baseUrl, apiKey, signal);
      const count = models.length;
      return {
        success: true,
        message: `Koneksi berhasil! Terdeteksi ${count} model.`,
        models,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Koneksi gagal.';
      return {
        success: false,
        message: msg,
        models: [],
      };
    }
  },
};
