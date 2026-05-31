"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getProducts, Product } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      router.push("/auth");
      return;
    }

    async function loadData() {
      try {
        setLoading(true);
        const data = await getProducts();
        setProducts(data);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load profile data";
        if (message.includes("Session expired")) {
          router.push("/auth");
          return;
        }
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isAuthenticated, isReady, router]);

  const stats = useMemo(() => {
    const validPrices = products.map((item) => item.current_price).filter((price): price is number => price !== null);
    const recentlyChecked = products.filter((item) => item.last_checked !== null).length;

    return {
      trackedProducts: products.length,
      pricedProducts: validPrices.length,
      recentlyChecked,
      avgPrice:
        validPrices.length > 0
          ? (validPrices.reduce((sum, value) => sum + value, 0) / validPrices.length).toFixed(2)
          : null,
    };
  }, [products]);

  const topProducts = useMemo(
    () => products.filter((item) => item.current_price !== null).slice(0, 5),
    [products]
  );

  if (!isReady || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f4ef]">
        <p className="text-[#60656b]">Loading profile...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-[1.8rem] border border-[#d8d6ce] bg-white p-6 md:p-8">
          <p className="inline-flex rounded-full border border-[#d8d6ce] bg-[#f6f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d9b8a]">
            Profile
          </p>
          <h1 className="mt-4 text-3xl font-semibold text-[#171a1d]">Your Tracking Snapshot</h1>
          <p className="mt-2 text-sm text-[#4c5258]">Performance summary based on your tracked products.</p>
          <Link
            href="/dashboard"
            className="mt-5 inline-flex rounded-full border border-[#cfcbbf] bg-[#f6f4ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#171a1d] transition hover:bg-[#f0eee8]"
          >
            Open Dashboard
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-[#6f756f]">Tracked Products</p>
            <p className="mt-3 text-3xl font-semibold text-[#171a1d]">{stats.trackedProducts}</p>
          </div>
          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-[#6f756f]">Priced Products</p>
            <p className="mt-3 text-3xl font-semibold text-[#171a1d]">{stats.pricedProducts}</p>
          </div>
          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-[#6f756f]">Recently Checked</p>
            <p className="mt-3 text-3xl font-semibold text-[#171a1d]">{stats.recentlyChecked}</p>
          </div>
          <div className="rounded-2xl border border-[#d8d6ce] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.15em] text-[#6f756f]">Average Price</p>
            <p className="mt-3 text-3xl font-semibold text-[#171a1d]">
              {stats.avgPrice ? `₹${stats.avgPrice}` : "N/A"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d8d6ce] bg-white p-6">
          <h2 className="text-xl font-semibold text-[#171a1d]">Top Tracked Products</h2>
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

          {topProducts.length === 0 ? (
            <p className="mt-4 text-sm text-[#4c5258]">No priced products yet. Add products to see detailed stats.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {topProducts.map((product, index) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 border-b border-[#e5e2d8] pb-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#b9b6ad]">{`0${index + 1}.`}</p>
                    <p className="truncate text-sm font-semibold text-[#171a1d]">{product.title || product.url}</p>
                  </div>
                  <span className="text-sm font-semibold text-[#7d9b8a]">
                    {product.current_price !== null ? `₹${product.current_price.toFixed(2)}` : "N/A"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
