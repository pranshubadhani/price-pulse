'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProductTracking, getProducts, Product } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productUrl, setProductUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadProducts() {
    try {
      setLoading(true);
      const data = await getProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load products';
      if (message.includes('Session expired')) {
        router.push('/login');
        return;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleAddProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const parsedTargetPrice = Number(targetPrice);
      if (!Number.isFinite(parsedTargetPrice) || parsedTargetPrice <= 0) {
        throw new Error('Target price must be a valid number greater than zero.');
      }

      await createProductTracking(productUrl, parsedTargetPrice);
      setSuccess('Product added successfully. Refreshing your dashboard...');
      setProductUrl('');
      setTargetPrice('');
      await loadProducts();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Failed to add product';
      if (message.includes('Session expired')) {
        router.push('/login');
        return;
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    avgPrice:
      products.length > 0
        ? (
            products.reduce((sum: number, p: Product) => sum + (p.current_price || 0), 0) /
            products.length
          ).toFixed(2)
        : 0,
    lastUpdated: products.length > 0
      ? (() => {
          const validTimestamps = products
            .map((p: Product) => (p.last_checked ? new Date(p.last_checked).getTime() : null))
            .filter((t): t is number => t !== null);
          return validTimestamps.length > 0 ? new Date(Math.max(...validTimestamps)) : null;
        })()
      : null,
  };

  return (
    <div className="min-h-screen bg-[#f6f4ef]">
      <div className="border-b border-[#d8d6ce] bg-[#f6f4ef]/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-[#171a1d]">Dashboard</h1>
              <p className="mt-1 text-[#4c5258]">Track and monitor your product prices</p>
            </div>
            <Link
              href="/"
              className="rounded-full border border-[#cfcbbf] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#171a1d] transition hover:bg-[#f0eee8]"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-[1.8rem] border border-[#d8d6ce] bg-white p-6 shadow-[0_28px_50px_-42px_rgba(23,26,29,0.8)]">
          <h2 className="text-xl font-semibold text-[#171a1d]">Track a new product</h2>
          <p className="mt-1 text-sm text-[#4c5258]">
            Paste a supported product URL and choose your target price.
          </p>

          <form className="mt-5 grid gap-3 md:grid-cols-6" onSubmit={handleAddProduct}>
            <input
              type="url"
              required
              value={productUrl}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setProductUrl(event.target.value)}
              placeholder="https://www.amazon.in/dp/..."
              className="md:col-span-4 rounded-xl border border-[#cfccc2] bg-white px-3 py-2.5 text-sm text-[#171a1d] outline-none ring-[#c9ff3e] transition focus:ring"
            />
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={targetPrice}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setTargetPrice(event.target.value)}
              placeholder="Target price"
              className="md:col-span-1 rounded-xl border border-[#cfccc2] bg-white px-3 py-2.5 text-sm text-[#171a1d] outline-none ring-[#c9ff3e] transition focus:ring"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="md:col-span-1 rounded-full bg-[#171a1d] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#c9ff3e] transition hover:bg-[#0d0f11] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </form>

          {success ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </p>
          ) : null}
        </section>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-6">
            <div className="text-sm font-medium uppercase tracking-wide text-[#6f756f]">Total Products</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-[#171a1d]">{stats.totalProducts}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-6">
            <div className="text-sm font-medium uppercase tracking-wide text-[#6f756f]">Average Price</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-semibold text-[#171a1d]">
                {stats.avgPrice !== 0 ? `₹${stats.avgPrice}` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-6">
            <div className="text-sm font-medium uppercase tracking-wide text-[#6f756f]">Last Updated</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-lg font-semibold text-[#171a1d]">
                {stats.lastUpdated
                  ? new Date(stats.lastUpdated).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-[#60656b]">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-12 text-center">
            <p className="mb-2 text-lg font-semibold text-[#171a1d]">No products tracked yet</p>
            <p className="text-sm text-[#4c5258]">Use the form above to add your first product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
