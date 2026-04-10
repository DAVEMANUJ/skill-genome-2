const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const localFallback = typeof window !== 'undefined'
  ? `http://${window.location.hostname}:5000`
  : 'http://localhost:5000';

export const API_BASE_URL = (configuredBaseUrl || localFallback).replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

let backendWarmupPromise: Promise<boolean> | null = null;

export const warmUpBackend = async (): Promise<boolean> => {
  if (backendWarmupPromise) {
    return backendWarmupPromise;
  }

  backendWarmupPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(apiUrl('/health'), {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  })();

  return backendWarmupPromise;
};

