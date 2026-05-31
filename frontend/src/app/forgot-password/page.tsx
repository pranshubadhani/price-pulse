"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiUrl } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(apiUrl("/accounts/forgot-password/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        const detail = data.detail ?? "Failed to send reset email";
        throw new Error(detail);
      }

      setSubmitted(true);
      setMessage("Check your email for password reset instructions.");
      setTimeout(() => router.push("/login"), 4000);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-6 py-14">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[#d8d6ce] bg-white p-8 shadow-[0_30px_60px_-45px_rgba(23,26,29,0.8)]">
        <p className="inline-flex rounded-full border border-[#d8d6ce] bg-[#f6f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d9b8a]">
          Password Reset
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-[#171a1d]">Forgot Password?</h1>
        <p className="mt-2 text-sm text-[#4c5258]">Enter your email to receive password reset instructions.</p>

        {!submitted ? (
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

            <button type="submit" disabled={isLoading} className="pp-split-pill w-full justify-center">
              <span className="pp-split-pill-label">{isLoading ? "Sending..." : "Send Reset Link"}</span>
              <span className="pp-split-pill-dot">→</span>
            </button>
          </form>
        ) : null}

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
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-[#b87355] hover:text-[#a36246]">
            Back to Login
          </Link>
        </p>
      </div>
    </main>
  );
}
