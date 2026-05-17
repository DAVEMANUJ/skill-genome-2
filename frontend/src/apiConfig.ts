// In production on Vercel, API calls go through Vercel's rewrite proxy (same-origin).
// In development, calls go directly to the local Flask server.
const localDev = typeof window !== 'undefined'
  ? `http://${window.location.hostname}:5000`
  : 'http://localhost:5000';

export const API_BASE_URL = import.meta.env.PROD ? '' : localDev;

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
