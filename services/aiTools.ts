import { ToolDefinition } from '../types/aiRun';
import { searchMessages } from './history';

/**
 * Tool lokal yang boleh dipanggil model. Semuanya berjalan di perangkat
 * dan tidak melakukan request jaringan sendiri.
 */
export const AI_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'search_history',
      description:
        'Mencari potongan percakapan lama milik pengguna pada riwayat chat lokal di perangkat. ' +
        'Gunakan ketika pengguna merujuk percakapan, keputusan, atau informasi sebelumnya ' +
        'yang tidak ada di konteks saat ini.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Kata kunci yang dicari di dalam isi pesan.',
          },
          limit: {
            type: 'integer',
            description: 'Jumlah maksimum hasil yang dikembalikan (1-20).',
            minimum: 1,
            maximum: 20,
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
  },
];

/** Label ramah manusia per tool untuk ditampilkan di UI. */
const TOOL_LABELS: Record<string, string> = {
  search_history: 'Mencari riwayat percakapan',
};

export const getToolLabel = (name: string): string =>
  TOOL_LABELS[name] ?? `Menjalankan ${name}`;

/** Ringkasan argumen satu baris agar tidak menumpuk di layar. */
export const summarizeToolArgs = (name: string, argsJson: string): string => {
  if (!argsJson?.trim()) return '';
  try {
    const parsed = JSON.parse(argsJson) as Record<string, unknown>;
    if (name === 'search_history' && typeof parsed.query === 'string') {
      return `"${parsed.query}"`;
    }
    const entries = Object.entries(parsed);
    if (entries.length === 0) return '';
    return entries
      .map(([key, value]) =>
        `${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`
      )
      .join(', ');
  } catch {
    return argsJson.slice(0, 80);
  }
};

/**
 * Menjalankan tool lokal dan mengembalikan hasil sebagai string JSON,
 * karena itulah yang dikirim balik ke model pada pesan `role: "tool"`.
 */
export const executeAiTool = async (name: string, argsJson: string): Promise<string> => {
  if (name === 'search_history') {
    let args: { query?: unknown; limit?: unknown } = {};
    try {
      args = JSON.parse(argsJson || '{}') as { query?: unknown; limit?: unknown };
    } catch {
      return JSON.stringify({ error: 'Argumen bukan JSON yang valid.' });
    }

    const query = typeof args.query === 'string' ? args.query : '';
    if (!query.trim()) {
      return JSON.stringify({ error: 'Parameter "query" wajib diisi.' });
    }

    const limit =
      typeof args.limit === 'number'
        ? Math.min(Math.max(Math.trunc(args.limit), 1), 20)
        : 8;

    const hits = await searchMessages(query, limit);
    if (hits.length === 0) {
      return JSON.stringify({
        query,
        results: [],
        note: 'Tidak ada pesan yang cocok di riwayat.',
      });
    }
    return JSON.stringify({ query, results: hits });
  }

  return JSON.stringify({ error: `Tool "${name}" tidak dikenal.` });
};
