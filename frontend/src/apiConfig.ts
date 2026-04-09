const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();
const localFallback = typeof window !== 'undefined'
  ? `http://${window.location.hostname}:5000`
  : 'http://localhost:5000';

export const API_BASE_URL = (configuredBaseUrl || localFallback).replace(/\/+$/, '');

export const apiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
