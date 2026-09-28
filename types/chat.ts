export type MessageRole = 'system' | 'user' | 'assistant';

/** Status penyimpanan pesan asisten di SQLite. */
export type MessageStatus = 'streaming' | 'done' | 'interrupted' | 'error';

export interface ChatMessage {
  id: string;
  sessionId?: string;
  role: MessageRole;
  content: string;
  createdAt?: string;
  status?: MessageStatus;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  projectId: string | null;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  sessionCount: number;
}

export interface ModelReasoningCapability {
  supported_efforts?: string[] | null;
  default_effort?: string | null;
  default_enabled?: boolean;
  supports_max_tokens?: boolean;
  mandatory?: boolean;
}

export interface ModelItem {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
  /** Parameter yang didukung model, mis. berisi "tools" dan "reasoning". */
  supported_parameters?: string[] | null;
  reasoning?: ModelReasoningCapability | null;
}

export interface AppSettings {
  baseUrl: string | null;
  apiKey: string | null;
  defaultModel: string | null;
  systemPrompt: string | null;
}
