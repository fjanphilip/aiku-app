import type { StreamResult, ToolCallDelta, WireToolCall } from '../types/aiRun';

/**
 * Parser SSE untuk endpoint chat completions yang OpenAI-compatible
 * (OpenRouter, 9Router, dsb).
 *
 * Sengaja dibuat murni tanpa dependensi React Native supaya bisa diuji
 * terpisah dari transport-nya.
 */

export interface StreamAccumulator {
  content: string;
  reasoningFromField: string;
  reasoningFromDetails: string;
  finishReason: string | null;
  done: boolean;
  toolCallsByIndex: Map<number, WireToolCall>;
}

export interface AppliedDelta {
  content?: string;
  reasoning?: string;
}

export const createStreamAccumulator = (): StreamAccumulator => ({
  content: '',
  reasoningFromField: '',
  reasoningFromDetails: '',
  finishReason: null,
  done: false,
  toolCallsByIndex: new Map(),
});

/**
 * Mengambil teks reasoning dari blok `reasoning_details` terstruktur.
 * Sebagian provider hanya mengirim bentuk ini, bukan `delta.reasoning`.
 */
export const reasoningTextFromDetails = (details: unknown): string => {
  if (!Array.isArray(details)) return '';
  let text = '';
  for (const detail of details) {
    if (!detail || typeof detail !== 'object') continue;
    const entry = detail as { type?: string; text?: string; summary?: string };
    if (entry.type === 'reasoning.text' && typeof entry.text === 'string') {
      text += entry.text;
    } else if (entry.type === 'reasoning.summary' && typeof entry.summary === 'string') {
      text += entry.summary;
    }
  }
  return text;
};

/**
 * Menerapkan satu baris SSE ke akumulator.
 *
 * Mengembalikan delta yang perlu diteruskan ke UI, atau `null` bila baris
 * tersebut bukan data yang relevan (baris kosong, komentar keep-alive,
 * atau JSON yang belum utuh).
 */
export const applySseLine = (
  acc: StreamAccumulator,
  rawLine: string
): AppliedDelta | null => {
  const line = rawLine.trim();
  // Baris kosong dan komentar keep-alive SSE (diawali ':') diabaikan.
  if (!line || line.startsWith(':')) return null;
  if (!line.startsWith('data:')) return null;

  const data = line.slice(5).trim();
  if (data === '[DONE]') {
    acc.done = true;
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    // Potongan JSON yang belum utuh: lewati.
    return null;
  }

  const choice = (parsed as { choices?: Array<Record<string, unknown>> })?.choices?.[0];
  if (!choice) return null;

  if (typeof choice.finish_reason === 'string') {
    acc.finishReason = choice.finish_reason;
  }

  const delta = choice.delta as
    | {
        content?: unknown;
        reasoning?: unknown;
        reasoning_details?: unknown;
        tool_calls?: unknown;
      }
    | undefined;
  if (!delta) return null;

  const applied: AppliedDelta = {};

  if (typeof delta.content === 'string' && delta.content) {
    acc.content += delta.content;
    applied.content = delta.content;
  }

  if (typeof delta.reasoning === 'string' && delta.reasoning) {
    acc.reasoningFromField += delta.reasoning;
    applied.reasoning = delta.reasoning;
  } else if (!acc.reasoningFromField) {
    const detailText = reasoningTextFromDetails(delta.reasoning_details);
    if (detailText) {
      acc.reasoningFromDetails += detailText;
      applied.reasoning = detailText;
    }
  }

  if (Array.isArray(delta.tool_calls)) {
    for (const raw of delta.tool_calls as ToolCallDelta[]) {
      const index = typeof raw?.index === 'number' ? raw.index : 0;
      const existing =
        acc.toolCallsByIndex.get(index) ??
        ({ id: '', type: 'function', function: { name: '', arguments: '' } } as WireToolCall);
      // Argumen datang terpotong-potong, jadi digabung per index.
      if (raw?.id) existing.id = raw.id;
      if (raw?.function?.name) existing.function.name = raw.function.name;
      if (raw?.function?.arguments) existing.function.arguments += raw.function.arguments;
      acc.toolCallsByIndex.set(index, existing);
    }
  }

  return applied.content || applied.reasoning ? applied : null;
};

export const toStreamResult = (acc: StreamAccumulator): StreamResult => ({
  finishReason: acc.finishReason,
  toolCalls: [...acc.toolCallsByIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, call]) => call),
  content: acc.content,
  reasoning: acc.reasoningFromField || acc.reasoningFromDetails,
});
