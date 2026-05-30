'use client';

import { useEffect, useState } from 'react';
import { getProductHistory, PriceHistoryEntry, Product, getProducts } from '@/lib/api';
import PriceChart from '@/components/PriceChart';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (!productId) return;

        // Fetch all products to find the specific one
        const products = await getProducts();
        const selectedProduct = products.find((p) => p.id === parseInt(productId));
        
        if (!selectedProduct) {
          setError('Product not found');
          return;
        }

        setProduct(selectedProduct);

        // Fetch price history
        const historyData = await getProductHistory(selectedProduct.id);
        setHistory(historyData);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load product details';
        if (message.includes('Session expired')) {
          router.push('/login');
          return;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_5%,#e6fffa_0%,#f8fafc_35%,#fef9c3_100%)]">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_5%,#e6fffa_0%,#f8fafc_35%,#fef9c3_100%)]">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="mb-4 block text-sky-700 hover:text-sky-800">
            ← Back to Dashboard
          </Link>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-red-600 text-lg">{error || 'Product not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate price statistics
  const priceStats = {
    current: product.current_price || 0,
    min: history.length > 0 ? Math.min(...history.map((h) => h.price)) : product.current_price || 0,
    max: history.length > 0 ? Math.max(...history.map((h) => h.price)) : product.current_price || 0,
    change:
      history.length > 1
        ? ((product.current_price || 0) - (history[history.length - 1]?.price || 0)).toFixed(2)
        : 0,
  };

  const isPositiveChange = parseFloat(priceStats.change as string) <= 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_5%,#e6fffa_0%,#f8fafc_35%,#fef9c3_100%)]">
      <div className="border-b border-slate-200/80 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="mb-4 block text-sm text-sky-700 hover:text-sky-800">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">{product.title}</h1>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            View on Site ↗
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium uppercase tracking-wide text-slate-500">Current Price</div>
            <div className="mt-2 text-3xl font-bold text-emerald-600">₹{priceStats.current.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium uppercase tracking-wide text-slate-500">Lowest Price</div>
            <div className="mt-2 text-3xl font-bold text-sky-600">₹{priceStats.min.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium uppercase tracking-wide text-slate-500">Highest Price</div>
            <div className="mt-2 text-3xl font-bold text-amber-600">₹{priceStats.max.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium uppercase tracking-wide text-slate-500">Price Change</div>
            <div className={`mt-2 text-3xl font-bold ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveChange ? '↓' : '↑'} ₹{Math.abs(parseFloat(priceStats.change as string)).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-slate-900">Price History</h2>
          <PriceChart data={history} loading={loading} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Last Updated:</span>
              <span className="text-slate-900">
                {new Date(product.last_checked).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tracked Since:</span>
              <span className="text-slate-900">{new Date(product.created_at).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Price History Entries:</span>
              <span className="text-slate-900">{history.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
