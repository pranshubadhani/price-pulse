'use client';

import { Product } from '@/lib/api';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/dashboard/products/${product.id}`}>
      <div className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
        <h3 className="mb-2 truncate text-lg font-semibold text-slate-900">
          {product.title || 'Untitled Product'}
        </h3>
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-sm text-slate-600">Current Price:</span>
            <span className="text-2xl font-bold text-emerald-600">
              {product.current_price ? `₹${product.current_price.toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Last updated: {new Date(product.last_checked).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400">
            Tracked since: {new Date(product.created_at).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })}
          </div>
          <div className="border-t border-slate-200 pt-2">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs font-medium text-sky-700 hover:text-sky-800"
              onClick={(e) => e.stopPropagation()}
            >
              View on site ↗
            </a>
          </div>
        </div>
      </div>
    </Link>
  );
}
