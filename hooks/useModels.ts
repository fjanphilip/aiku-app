import { useCallback, useState } from 'react';
import { ModelItem } from '../types/chat';
import { ModelCapabilities } from '../types/aiRun';
import { nineRouterClient } from '../services/nineRouterClient';
import { getStoredData } from '../services/storage';

// Cache in-memory tingkat modul: daftar model jarang berubah, jadi
// tidak perlu menyimpan storage key baru.
let cachedModels: ModelItem[] | null = null;

/**
 * Menurunkan capability model dari data `GET /v1/models`.
 * Tanpa data, keduanya dianggap tidak didukung agar kita tidak mengirim
 * `tools` / `reasoning` ke model yang akan menolaknya.
 */
export const resolveModelCapabilities = (
  models: ModelItem[] | null,
  modelId: string | null
): ModelCapabilities => {
  const model = models?.find((item) => item.id === modelId);
  const params = model?.supported_parameters ?? null;
  return {
    supportsTools: Boolean(params?.includes('tools')),
    supportsReasoning: Boolean(params?.includes('reasoning') || model?.reasoning),
  };
};

/**
 * Mengambil daftar model dari endpoint /v1/models milik 9Router.
 * Dipakai oleh model picker di composer.
 */
export const useModels = () => {
  const [models, setModels] = useState<ModelItem[]>(cachedModels ?? []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (cachedModels && !force) {
      setModels(cachedModels);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { baseUrl, apiKey } = await getStoredData();

      if (!baseUrl || !apiKey) {
        setModels([]);
        setError('Konfigurasi 9Router belum lengkap. Buka Pengaturan.');
        return;
      }

      const result = await nineRouterClient.getModels(baseUrl, apiKey);
      cachedModels = result;
      setModels(result);
    } catch (err) {
      setModels([]);
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar model.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { models, isLoading, error, load };
};
