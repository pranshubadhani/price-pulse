"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(apiUrl("/auth/login/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const detail = data.detail ?? "Invalid credentials";
        throw new Error(detail);
      }

      const data = await response.json();
      localStorage.setItem("pricepulse_access", data.access);
      localStorage.setItem("pricepulse_refresh", data.refresh);
      setMessage("Login successful. Redirecting to your dashboard...");
      router.push("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(120deg,#f8fffb_0%,#e7f6ff_55%,#eef4ff_100%)] px-6 py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-8 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Welcome Back
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Access your PricePulse account.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-200 transition focus:ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-emerald-200 transition focus:ring"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        {message ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <p className="mt-5 text-sm text-slate-600">
          New to PricePulse?{" "}
          <Link href="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
