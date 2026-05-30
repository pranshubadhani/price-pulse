'use client';

import { Product } from '@/lib/api';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/dashboard/products/${product.id}`}>
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
        <h3 className="text-lg font-semibold text-gray-900 truncate mb-2">
          {product.title || 'Untitled Product'}
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-gray-600 text-sm">Current Price:</span>
            <span className="text-2xl font-bold text-green-600">
              {product.current_price ? `₹${product.current_price.toFixed(2)}` : 'N/A'}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Last updated: {new Date(product.last_checked).toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-gray-400">
            Tracked since: {new Date(product.created_at).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })}
          </div>
          <div className="pt-2 border-t border-gray-200">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-xs truncate"
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
