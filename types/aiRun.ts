// ============================================================
// Satu "run" AI = satu siklus jawaban asisten.
// RunState adalah satu-satunya sumber kebenaran untuk semua
// indikator status di UI.
// ============================================================

export type RunStatus =
  | 'idle'
  | 'submitted'
  | 'reasoning'
  | 'tool_running'
  | 'streaming'
  | 'error';

export type ToolStepStatus = 'running' | 'done' | 'error';

export interface ToolStep {
  id: string;
  name: string;
  args?: string;
  status: ToolStepStatus;
  label: string;
  result?: string;
}

export interface RunState {
  status: RunStatus;
  reasoning: string;
  steps: ToolStep[];
  error?: string;
}

export const EMPTY_RUN_STATE: RunState = {
  status: 'idle',
  reasoning: '',
  steps: [],
};

// ── Bentuk wire OpenAI-compatible ──────────────────────────────

export interface WireToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export interface WireMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: WireToolCall[];
  tool_call_id?: string;
}

/** Potongan `delta.tool_calls` — argumen datang bertahap per `index`. */
export interface ToolCallDelta {
  index?: number;
  id?: string;
  type?: string;
  function?: { name?: string; arguments?: string };
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

/** Ringkasan hasil akhir sebuah stream, dipakai untuk loop agentic. */
export interface StreamResult {
  finishReason: string | null;
  toolCalls: WireToolCall[];
  content: string;
  reasoning: string;
}

/** Diturunkan dari `supported_parameters` / `reasoning` pada data model. */
export interface ModelCapabilities {
  supportsTools: boolean;
  supportsReasoning: boolean;
}
