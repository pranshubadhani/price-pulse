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

async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pricepulse_access');
}

async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<T> {
  const token = await getAuthToken();
  const url = apiUrl(endpoint);

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.detail || error.error || `API error: ${response.status}`);
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
