function normalizeApiBaseUrl(rawBase?: string): string {
  const fallback = 'http://localhost:8000/api';
  const base = (rawBase || fallback).trim().replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export interface Product {
  id: number;
  url: string;
  title: string;
  current_price: number | null;
  last_checked: string;
  created_at: string;
}

export interface UserTrackedProduct {
  id: number;
  target_price: number;
  alert_enabled: boolean;
}

export interface PriceHistoryEntry {
  id: number;
  product: number;
  price: number;
  timestamp: string;
}

export interface ApiError {
  detail?: string;
  error?: string;
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pricepulse_access');
}

async function getRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pricepulse_refresh');
}

function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('pricepulse_access', token);
}

function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('pricepulse_access');
  localStorage.removeItem('pricepulse_refresh');
}

async function parseApiError(response: Response): Promise<string> {
  try {
    const error = (await response.json()) as ApiError;
    return error.detail || error.error || `API error: ${response.status}`;
  } catch {
    return `API error: ${response.status}`;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await getRefreshToken();
  if (!refresh) return null;

  const response = await fetch(apiUrl('/auth/refresh/'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearAuthTokens();
    return null;
  }

  const data = (await response.json()) as { access?: string };
  if (!data.access) {
    clearAuthTokens();
    return null;
  }

  setAccessToken(data.access);
  return data.access;
}

async function requestWithToken(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  body: unknown,
  token: string | null
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  let token = await getAccessToken();
  const url = apiUrl(endpoint);

  let response = await requestWithToken(url, method, body, token);

  if (response.status === 401 && token) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new Error('Session expired. Please log in again.');
    }
    token = refreshed;
    response = await requestWithToken(url, method, body, token);
  }

  if (!response.ok) {
    throw new Error(await parseApiError(response));
  }

  return response.json() as Promise<T>;
}

export async function getProducts(): Promise<Product[]> {
  return apiCall<Product[]>('/products/');
}

export async function getProductHistory(productId: number): Promise<PriceHistoryEntry[]> {
  return apiCall<PriceHistoryEntry[]>(`/products/${productId}/history/`);
}

export async function createProductTracking(url: string, targetPrice: number): Promise<Product> {
  return apiCall<Product>('/products/', 'POST', {
    url,
    target_price: targetPrice,
  });
}

export async function updateProductTracking(
  productId: number,
  targetPrice: number,
  alertEnabled: boolean
): Promise<Product> {
  return apiCall<Product>(`/products/${productId}/`, 'PUT', {
    target_price: targetPrice,
    alert_enabled: alertEnabled,
  });
}
