function normalizeApiBaseUrl(rawBase?: string): string {
  const fallback = 'http://localhost:8000/api';
  const base = (rawBase || fallback).trim().replace(/\/$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}

export const API_BASE_URL = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
export const ACCESS_TOKEN_KEY = 'pricepulse_access';
export const REFRESH_TOKEN_KEY = 'pricepulse_refresh';
export const AUTH_STATE_EVENT = 'pricepulse-auth-changed';

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export interface Product {
  id: number;
  url: string;
  title: string;
  current_price: number | null;
  last_checked: string | null;
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

interface ProductApiResponse extends Omit<Product, 'current_price' | 'last_checked'> {
  current_price: number | string | null;
  last_checked: string | null;
}

interface PriceHistoryEntryApiResponse extends Omit<PriceHistoryEntry, 'price'> {
  price: number | string;
}

export interface ApiError {
  detail?: string;
  error?: string;
}

function parseNumber(value: number | string | null): number | null {
  if (value === null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProduct(product: ProductApiResponse): Product {
  return {
    ...product,
    current_price: parseNumber(product.current_price),
    last_checked: product.last_checked,
  };
}

function normalizeHistoryEntry(entry: PriceHistoryEntryApiResponse): PriceHistoryEntry {
  return {
    ...entry,
    price: parseNumber(entry.price) ?? 0,
  };
}

async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

async function getRefreshToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function notifyAuthStateChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_STATE_EVENT));
}

function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  notifyAuthStateChange();
}

function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  notifyAuthStateChange();
}

export function hasAuthTokens(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY) && localStorage.getItem(REFRESH_TOKEN_KEY));
}

export function setAuthTokens(access: string, refresh: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, access);
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  notifyAuthStateChange();
}

export function logoutUser(): void {
  clearAuthTokens();
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
  const products = await apiCall<ProductApiResponse[]>('/products/');
  return products.map(normalizeProduct);
}

export async function getProductHistory(productId: number): Promise<PriceHistoryEntry[]> {
  const history = await apiCall<PriceHistoryEntryApiResponse[]>(`/products/${productId}/history/`);
  return history.map(normalizeHistoryEntry);
}

export async function createProductTracking(url: string, targetPrice: number): Promise<Product> {
  const product = await apiCall<ProductApiResponse>('/products/', 'POST', {
    url,
    target_price: targetPrice,
  });
  return normalizeProduct(product);
}

export async function updateProductTracking(
  productId: number,
  targetPrice: number,
  alertEnabled: boolean
): Promise<Product> {
  const product = await apiCall<ProductApiResponse>(`/products/${productId}/`, 'PUT', {
    target_price: targetPrice,
    alert_enabled: alertEnabled,
  });
  return normalizeProduct(product);
}
