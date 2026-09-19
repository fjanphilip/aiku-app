import { fetch } from 'expo/fetch';
import { ChatMessage, ModelItem } from '../types/chat';

export interface ChatStreamOptions {
  baseUrl: string;
  apiKey: string;
  model?: string | null;
  systemPrompt?: string | null;
  messages: ChatMessage[];
  onToken: (content: string) => void;
  onError: (errorMessage: string) => void;
  onComplete: () => void;
  signal?: AbortSignal;
}

export const cleanBaseUrl = (url: string): string => {
  return url.trim().replace(/\/+$/, '');
};

export const nineRouterClient = {
  /**
   * Mengirim chat completions ke 9Router dengan streaming SSE.
   */
  async chatStream(options: ChatStreamOptions): Promise<void> {
    const {
      baseUrl,
      apiKey,
      model,
      systemPrompt,
      messages,
      onToken,
      onError,
      onComplete,
      signal,
    } = options;

    const trimmedBaseUrl = cleanBaseUrl(baseUrl || '');
    const trimmedApiKey = (apiKey || '').trim();

    if (!trimmedBaseUrl || !trimmedApiKey) {
      onError('Base URL atau API Key 9Router belum dikonfigurasi di Pengaturan.');
      return;
    }

    const effectiveModel = (model && model.trim()) ? model.trim() : 'gemini-2.0-flash';

    // Susun payload messages sesuai format OpenAI
    const formattedMessages: Array<{ role: string; content: string }> = [];

    // Jika ada system prompt dan belum ada pesan system di awal
    if (systemPrompt && systemPrompt.trim()) {
      const firstIsSystem = messages.length > 0 && messages[0].role === 'system';
      if (!firstIsSystem) {
        formattedMessages.push({
          role: 'system',
          content: systemPrompt.trim(),
        });
      }
    }

    for (const msg of messages) {
      formattedMessages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const requestBody = {
      model: effectiveModel,
      messages: formattedMessages,
      stream: true,
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
          onError('Autentikasi gagal (401 Unauthorized): Periksa API Key Anda.');
        } else if (response.status === 403) {
          if (errorDetails.includes('FreeTierError') || errorDetails.includes('OpenCode')) {
            onError('Provider OpenCode di 9Router VPS terkena proteksi upstream FreeTierError. Silakan update 9Router di VPS ke versi terbaru (patch canonical session format OpenCode), atau gunakan provider lain seperti Gemini.');
          } else {
            onError(`Akses ditolak (403 Forbidden): ${errorDetails}`);
          }
        } else if (response.status === 404) {
          onError(`Endpoint tidak ditemukan (404 Not Found): Periksa Base URL 9Router (${trimmedBaseUrl}).`);
        } else if (
          errorDetails.includes('end of life') ||
          errorDetails.includes('no longer available') ||
          errorDetails.includes('Gone') ||
          errorDetails.includes('410')
        ) {
          onError('Model ini telah mencapai batas akhir penggunaan (End of Life / EOL) dari provider NVIDIA/upstream dan sudah ditutup permanen. Silakan pilih model lain di Pengaturan.');
        } else {
          onError(`Error ${response.status}: ${errorDetails || 'Permintaan gagal diproses'}`);
        }
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('Gagal membuka streaming response dari 9Router.');
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Simpan sisa baris yang belum selesai di buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine.startsWith(':')) {
            // Abaikan empty line atau SSE comment/heartbeat
            continue;
          }

          if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.slice(5).trim();

            if (dataStr === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const deltaContent = parsed.choices?.[0]?.delta?.content;
              if (deltaContent) {
                onToken(deltaContent);
              }
            } catch {
              // Abaikan parsing error untuk chunk non-JSON parsial
            }
          }
        }
      }

      // Selesai membaca stream
      onComplete();
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'AbortError' || signal?.aborted)) {
        onError('Respon dihentikan oleh pengguna.');
      } else {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan koneksi';
        onError(`Koneksi error: ${message}`);
      }
    }
  },

  /**
   * Mengambil daftar model yang tersedia dari 9Router (GET /v1/models).
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
   * Menguji koneksi ke 9Router dan memvalidasi kredensial.
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
        message: `Koneksi berhasil! Terdeteksi ${count} model dari 9Router.`,
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