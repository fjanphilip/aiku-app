export type MessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  sessionId?: string;
  role: MessageRole;
  content: string;
  createdAt?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

export interface ModelItem {
  id: string;
  object?: string;
  created?: number;
  owned_by?: string;
}

export interface AppSettings {
  baseUrl: string | null;
  apiKey: string | null;
  defaultModel: string | null;
  systemPrompt: string | null;
}
