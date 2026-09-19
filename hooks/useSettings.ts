import { useState, useEffect, useCallback } from 'react';
import {
  getStoredData,
  saveBaseUrl as storeBaseUrl,
  saveApiKey as storeApiKey,
  saveDefaultModel as storeDefaultModel,
  saveSystemPrompt as storeSystemPrompt,
  saveAllSettings as storeAllSettings,
  clearAll as storeClearAll,
} from '../services/storage';
import { nineRouterClient } from '../services/nineRouterClient';
import { AppSettings, ModelItem } from '../types/chat';

export interface SettingsState {
  baseUrl: string | null;
  apiKey: string | null;
  defaultModel: string | null;
  systemPrompt: string | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
}

export const useSettings = () => {
  const [state, setState] = useState<SettingsState>({
    baseUrl: null,
    apiKey: null,
    defaultModel: null,
    systemPrompt: null,
    status: 'idle',
    error: null,
  });

  const [availableModels, setAvailableModels] = useState<ModelItem[]>([]);

  const loadSettings = useCallback(async () => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      const data: AppSettings = await getStoredData();
      setState({
        baseUrl: data.baseUrl,
        apiKey: data.apiKey,
        defaultModel: data.defaultModel,
        systemPrompt: data.systemPrompt,
        status: data.baseUrl && data.apiKey ? 'success' : 'idle',
        error: null,
      });
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Gagal memuat pengaturan',
      }));
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const setBaseUrl = async (baseUrl: string) => {
    try {
      await storeBaseUrl(baseUrl);
      setState((prev) => ({ ...prev, baseUrl, error: null }));
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Gagal menyimpan Base URL',
      }));
    }
  };

  const setApiKey = async (apiKey: string) => {
    try {
      await storeApiKey(apiKey);
      setState((prev) => ({ ...prev, apiKey, error: null }));
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Gagal menyimpan API Key',
      }));
    }
  };

  const setDefaultModel = async (model: string) => {
    try {
      await storeDefaultModel(model);
      setState((prev) => ({ ...prev, defaultModel: model, error: null }));
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Gagal menyimpan Model Default',
      }));
    }
  };

  const setSystemPrompt = async (prompt: string) => {
    try {
      await storeSystemPrompt(prompt);
      setState((prev) => ({ ...prev, systemPrompt: prompt, error: null }));
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Gagal menyimpan System Prompt',
      }));
    }
  };

  const saveAll = async (settings: {
    baseUrl: string;
    apiKey: string;
    defaultModel?: string;
    systemPrompt?: string;
  }) => {
    setState((prev) => ({ ...prev, status: 'loading' }));
    try {
      await storeAllSettings(settings);
      setState((prev) => ({
        ...prev,
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        defaultModel: settings.defaultModel ?? prev.defaultModel,
        systemPrompt: settings.systemPrompt ?? prev.systemPrompt,
        status: 'success',
        error: null,
      }));
    } catch (err: unknown) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: err instanceof Error ? err.message : 'Gagal menyimpan konfigurasi',
      }));
      throw err;
    }
  };

  const testConnection = async (
    targetBaseUrl: string,
    targetApiKey: string
  ): Promise<{ success: boolean; message: string; models: ModelItem[] }> => {
    const result = await nineRouterClient.testConnection(targetBaseUrl, targetApiKey);
    if (result.success && result.models.length > 0) {
      setAvailableModels(result.models);
    }
    return result;
  };

  const resetSettings = async () => {
    await storeClearAll();
    setAvailableModels([]);
    setState({
      baseUrl: null,
      apiKey: null,
      defaultModel: null,
      systemPrompt: null,
      status: 'idle',
      error: null,
    });
  };

  return {
    ...state,
    availableModels,
    loadSettings,
    setBaseUrl,
    setApiKey,
    setDefaultModel,
    setSystemPrompt,
    saveAll,
    testConnection,
    resetSettings,
  };
};