const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const localFallback = import.meta.env.PROD
  ? 'https://skillgenome-t52e.onrender.com'
  : (typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000');

export const API_BASE_URL = (configuredBaseUrl || localFallback).replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

/**
 * Ping the backend health endpoint once.
 * Returns true if the backend responded with HTTP 2xx, false otherwise.
 */
export const pingBackend = async (timeoutMs = 10_000): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(apiUrl('/health'), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
};
