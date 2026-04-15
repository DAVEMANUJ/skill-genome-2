const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const localFallback = import.meta.env.PROD
  ? 'https://skillgenome-t52e.onrender.com'
  : (typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000');

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
    const maxRetries = 20; // 20 retries at 3000ms delay = 60 seconds
    const retryDelay = 3000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const response = await fetch(apiUrl('/health'), {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return true;
        }
      } catch {
        // Ignore fetch errors or aborts and just retry
      }
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    return false;
  })();

  return backendWarmupPromise;
};

