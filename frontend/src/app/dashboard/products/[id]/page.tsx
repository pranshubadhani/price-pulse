'use client';

import { useEffect, useState } from 'react';
import { getProductHistory, PriceHistoryEntry, Product, getProducts } from '@/lib/api';
import PriceChart from '@/components/PriceChart';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ProductDetailPage() {
  const params = useParams();
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
        setError(err instanceof Error ? err.message : 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [productId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 block">
            ← Back to Dashboard
          </Link>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 block text-sm">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
          >
            View on Site ↗
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Price Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Current Price</div>
            <div className="mt-2 text-3xl font-bold text-green-600">₹{priceStats.current.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Lowest Price</div>
            <div className="mt-2 text-3xl font-bold text-blue-600">₹{priceStats.min.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Highest Price</div>
            <div className="mt-2 text-3xl font-bold text-orange-600">₹{priceStats.max.toFixed(2)}</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">Price Change</div>
            <div className={`mt-2 text-3xl font-bold ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
              {isPositiveChange ? '↓' : '↑'} ₹{Math.abs(parseFloat(priceStats.change as string)).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Price History</h2>
          <PriceChart data={history} loading={loading} />
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-gray-900">
                {new Date(product.last_checked).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tracked Since:</span>
              <span className="text-gray-900">{new Date(product.created_at).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Price History Entries:</span>
              <span className="text-gray-900">{history.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
