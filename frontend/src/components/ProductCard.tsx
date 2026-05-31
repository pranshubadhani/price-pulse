'use client';

import { Product } from '@/lib/api';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  onDelete?: (productId: number) => void;
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
  const lastCheckedLabel = product.last_checked
    ? new Date(product.last_checked).toLocaleString('en-IN')
    : 'Never';

  return (
    <div className="rounded-2xl border border-[#d8d6ce] bg-white p-6 transition hover:-translate-y-0.5 hover:border-[#b87355]">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="mb-2 truncate text-lg font-semibold text-[#171a1d]">
          {product.title || 'Untitled Product'}
        </h3>
        {onDelete ? (
          <button
            type="button"
            onClick={() => onDelete(product.id)}
            className="rounded-full border border-[#e0beb1] bg-[#fff7f5] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9d4d32] hover:bg-[#ffece6]"
          >
            Delete
          </button>
        ) : null}
      </div>
      <div className="space-y-2">
        <div className="flex items-end justify-between">
          <span className="text-sm text-[#5a6166]">Current Price:</span>
          <span className="text-2xl font-semibold text-[#7d9b8a]">
            {product.current_price ? `₹${product.current_price.toFixed(2)}` : 'N/A'}
          </span>
        </div>
        <div className="text-xs text-[#5a6166]">
          Last updated: {lastCheckedLabel}
        </div>
        <div className="text-xs text-[#8b8f91]">
          Tracked since: {new Date(product.created_at).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })}
        </div>
        <div className="flex items-center justify-between border-t border-[#e5e2d8] pt-2">
          <Link
            href={`/dashboard/products/${product.id}`}
            data-testid={`link-/dashboard/products/${product.id}`}
            className="text-xs font-medium text-[#171a1d] hover:text-[#0d0f11]"
          >
            Open details
          </Link>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-xs font-medium text-[#b87355] hover:text-[#a36246]"
          >
            View on site ↗
          </a>
        </div>
      </div>
    </div>
  );
}
