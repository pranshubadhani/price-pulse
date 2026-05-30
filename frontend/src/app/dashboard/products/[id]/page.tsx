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
      <div className="flex min-h-screen items-center justify-center bg-[#f6f4ef]">
        <p className="text-[#60656b]">Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#f6f4ef]">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="mb-4 block text-[#b87355] hover:text-[#a36246]">
            ← Back to Dashboard
          </Link>
          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-8 text-center">
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
    <div className="min-h-screen bg-[#f6f4ef]">
      <div className="border-b border-[#d8d6ce] bg-[#f6f4ef]/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="mb-4 block text-sm text-[#b87355] hover:text-[#a36246]">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold text-[#171a1d]">{product.title}</h1>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-[#b87355] hover:text-[#a36246]"
          >
            View on Site ↗
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-6">
            <div className="text-sm font-medium uppercase tracking-wide text-[#6f756f]">Current Price</div>
            <div className="mt-2 text-3xl font-semibold text-[#7d9b8a]">₹{priceStats.current.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-6">
            <div className="text-sm font-medium uppercase tracking-wide text-[#6f756f]">Lowest Price</div>
            <div className="mt-2 text-3xl font-semibold text-[#7d9b8a]">₹{priceStats.min.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-6">
            <div className="text-sm font-medium uppercase tracking-wide text-[#6f756f]">Highest Price</div>
            <div className="mt-2 text-3xl font-semibold text-[#b87355]">₹{priceStats.max.toFixed(2)}</div>
          </div>

          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-6">
            <div className="text-sm font-medium uppercase tracking-wide text-[#6f756f]">Price Change</div>
            <div className={`mt-2 text-3xl font-bold ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveChange ? '↓' : '↑'} ₹{Math.abs(parseFloat(priceStats.change as string)).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-[#d8d6ce] bg-white p-6">
          <h2 className="mb-6 text-xl font-semibold text-[#171a1d]">Price History</h2>
          <PriceChart data={history} loading={loading} />
        </div>

        <div className="rounded-2xl border border-[#d8d6ce] bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-[#171a1d]">Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#5a6166]">Last Updated:</span>
              <span className="text-[#171a1d]">
                {product.last_checked ? new Date(product.last_checked).toLocaleString('en-IN') : 'Never'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5a6166]">Tracked Since:</span>
              <span className="text-[#171a1d]">{new Date(product.created_at).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5a6166]">Price History Entries:</span>
              <span className="text-[#171a1d]">{history.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
