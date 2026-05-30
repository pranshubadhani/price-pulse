'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { createProductTracking, getProducts, Product } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

export default function DashboardPage() {
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
      setError(err instanceof Error ? err.message : 'Failed to load products');
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
      setError(submitError instanceof Error ? submitError.message : 'Failed to add product');
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
      ? new Date(Math.max(...products.map((p: Product) => new Date(p.last_checked).getTime())))
      : null,
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_5%,#e6fffa_0%,#f8fafc_35%,#fef9c3_100%)]">
      <div className="border-b border-slate-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="mt-1 text-slate-600">Track and monitor your product prices</p>
            </div>
            <Link
              href="/"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Home
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900">Track a new product</h2>
          <p className="mt-1 text-sm text-slate-600">
            Paste a supported product URL and choose your target price.
          </p>

          <form className="mt-5 grid gap-3 md:grid-cols-6" onSubmit={handleAddProduct}>
            <input
              type="url"
              required
              value={productUrl}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setProductUrl(event.target.value)}
              placeholder="https://www.amazon.in/dp/..."
              className="md:col-span-4 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 transition focus:ring"
            />
            <input
              type="number"
              min="1"
              step="0.01"
              required
              value={targetPrice}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setTargetPrice(event.target.value)}
              placeholder="Target price"
              className="md:col-span-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-emerald-200 transition focus:ring"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="md:col-span-1 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium uppercase tracking-wide text-slate-500">Total Products</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-bold text-slate-900">{stats.totalProducts}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium uppercase tracking-wide text-slate-500">Average Price</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-bold text-slate-900">
                {stats.avgPrice !== 0 ? `₹${stats.avgPrice}` : 'N/A'}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-medium uppercase tracking-wide text-slate-500">Last Updated</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-lg font-bold text-slate-900">
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
            <p className="text-slate-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="mb-2 text-lg font-semibold text-slate-800">No products tracked yet</p>
            <p className="text-sm text-slate-600">Use the form above to add your first product.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
