"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiUrl } from "@/lib/api";

export default function RegisterPage() {
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
      const response = await fetch(apiUrl("/auth/register/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        const detail = data.email?.[0] ?? data.password?.[0] ?? "Registration failed";
        throw new Error(detail);
      }

      setMessage("Registration successful. Redirecting to login...");
      setEmail("");
      setPassword("");
      router.push("/login");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-6 py-14">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[#d8d6ce] bg-white p-8 shadow-[0_30px_60px_-45px_rgba(23,26,29,0.8)]">
        <p className="inline-flex rounded-full border border-[#d8d6ce] bg-[#f6f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#b87355]">
          Join PricePulse
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-[#171a1d]">Register</h1>
        <p className="mt-2 text-sm text-[#4c5258]">Create your PricePulse account.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#3f4347]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#cfccc2] px-3 py-2.5 text-[#171a1d] outline-none ring-[#c9ff3e] transition focus:ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#3f4347]" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#cfccc2] px-3 py-2.5 text-[#171a1d] outline-none ring-[#c9ff3e] transition focus:ring"
            />
          </div>

          <button type="submit" disabled={isLoading} className="pp-split-pill w-full justify-center">
            <span className="pp-split-pill-label">{isLoading ? "Registering" : "Register"}</span>
            <span className="pp-split-pill-dot">→</span>
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

        <p className="mt-5 text-sm text-[#4c5258]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#b87355] hover:text-[#a36246]">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
