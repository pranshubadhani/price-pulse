"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function AuthLandingPage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isReady, router]);

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-6 py-14">
      <section className="mx-auto w-full max-w-4xl rounded-[2rem] border border-[#d8d6ce] bg-white p-8 shadow-[0_30px_60px_-45px_rgba(23,26,29,0.8)] md:p-10">
        <p className="inline-flex rounded-full border border-[#d8d6ce] bg-[#f6f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d9b8a]">
          Account Access
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-[#171a1d] md:text-4xl">Welcome to PricePulse</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#4c5258] md:text-base">
          Continue with your account or create a new one to track products, monitor trends, and get
          timely price-drop alerts.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/login"
            className="rounded-2xl border border-[#d8d6ce] bg-[#f6f4ef] p-6 transition hover:border-[#b87355]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7d9b8a]">Existing User</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#171a1d]">Login</h2>
            <p className="mt-2 text-sm text-[#4c5258]">Sign in to access your dashboard and tracked products.</p>
          </Link>

          <Link
            href="/register"
            className="rounded-2xl border border-[#d8d6ce] bg-white p-6 transition hover:border-[#b87355]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b87355]">New User</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#171a1d]">Create Account</h2>
            <p className="mt-2 text-sm text-[#4c5258]">Register to start tracking prices and setting target alerts.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
