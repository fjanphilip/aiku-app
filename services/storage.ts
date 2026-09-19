import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AppSettings } from '../types/chat';

const STORAGE_KEYS = {
  BASE_URL: 'ai-chat-base-url',
  API_KEY: 'ai-chat-api-key',
  DEFAULT_MODEL: 'ai-chat-default-model',
  SYSTEM_PROMPT: 'ai-chat-system-prompt',
} as const;

const isWeb = Platform.OS === 'web';

const store = {
  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (isWeb) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const getStoredData = async (): Promise<AppSettings> => {
  const [baseUrl, apiKey, defaultModel, systemPrompt] = await Promise.all([
    store.getItem(STORAGE_KEYS.BASE_URL),
    store.getItem(STORAGE_KEYS.API_KEY),
    store.getItem(STORAGE_KEYS.DEFAULT_MODEL),
    store.getItem(STORAGE_KEYS.SYSTEM_PROMPT),
  ]);

  return {
    baseUrl: baseUrl ?? null,
    apiKey: apiKey ?? null,
    defaultModel: defaultModel ?? null,
    systemPrompt: systemPrompt ?? null,
  };
};

export const saveBaseUrl = async (baseUrl: string): Promise<void> => {
  await store.setItem(STORAGE_KEYS.BASE_URL, baseUrl.trim());
};

export const saveApiKey = async (apiKey: string): Promise<void> => {
  await store.setItem(STORAGE_KEYS.API_KEY, apiKey.trim());
};

export const saveDefaultModel = async (model: string): Promise<void> => {
  await store.setItem(STORAGE_KEYS.DEFAULT_MODEL, model.trim());
};

export const saveSystemPrompt = async (systemPrompt: string): Promise<void> => {
  await store.setItem(STORAGE_KEYS.SYSTEM_PROMPT, systemPrompt.trim());
};

export const saveAllSettings = async (settings: {
  baseUrl: string;
  apiKey: string;
  defaultModel?: string;
  systemPrompt?: string;
}): Promise<void> => {
  const promises: Promise<void>[] = [
    store.setItem(STORAGE_KEYS.BASE_URL, settings.baseUrl.trim()),
    store.setItem(STORAGE_KEYS.API_KEY, settings.apiKey.trim()),
  ];
  if (settings.defaultModel !== undefined) {
    promises.push(store.setItem(STORAGE_KEYS.DEFAULT_MODEL, settings.defaultModel.trim()));
  }
  if (settings.systemPrompt !== undefined) {
    promises.push(store.setItem(STORAGE_KEYS.SYSTEM_PROMPT, settings.systemPrompt.trim()));
  }
  await Promise.all(promises);
};

export const clearAll = async (): Promise<void> => {
  await Promise.all([
    store.deleteItem(STORAGE_KEYS.BASE_URL),
    store.deleteItem(STORAGE_KEYS.API_KEY),
    store.deleteItem(STORAGE_KEYS.DEFAULT_MODEL),
    store.deleteItem(STORAGE_KEYS.SYSTEM_PROMPT),
  ]);
};