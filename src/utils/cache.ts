interface CacheItem<T> {
  data: T;
  timestamp: number;
  timeout: number;
}

const cache = new Map<string, CacheItem<any>>();

export const getCachedResponse = <T>(key: string): T | null => {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() - item.timestamp > item.timeout) {
    cache.delete(key);
    return null;
  }

  return item.data;
};

export const cacheResponse = <T>(key: string, data: T, timeoutMinutes: number = 5): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    timeout: timeoutMinutes * 60 * 1000 // convertir a milisegundos
  });
};

export const clearCache = (): void => {
  cache.clear();
};

export const withCache = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  timeoutMinutes: number = 5
): Promise<T> => {
  const cached = getCachedResponse<T>(key);
  if (cached) {
    return cached;
  }

  const data = await fetchFn();
  cacheResponse(key, data, timeoutMinutes);
  return data;
};