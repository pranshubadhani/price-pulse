"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { apiUrl } from "@/lib/api";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Validate params on load
  if (!email || !token) {
    return (
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[#d8d6ce] bg-white p-8 shadow-[0_30px_60px_-45px_rgba(23,26,29,0.8)]">
        <p className="inline-flex rounded-full border border-[#d8d6ce] bg-[#f6f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d9b8a]">
          Invalid Link
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-[#171a1d]">Invalid Reset Link</h1>
        <p className="mt-2 text-sm text-[#4c5258]">
          The password reset link is missing required information or has expired.
        </p>
        <Link href="/forgot-password" className="mt-6 block rounded-xl bg-[#b87355] px-4 py-2.5 text-center font-medium text-white hover:bg-[#a36246]">
          Request New Reset Link
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(apiUrl("/accounts/reset-password/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          token,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const detail = data.detail ?? "Failed to reset password";
        throw new Error(detail);
      }

      setSubmitted(true);
      setMessage("Your password has been reset successfully!");
      setTimeout(() => router.push("/login"), 3000);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-[2rem] border border-[#d8d6ce] bg-white p-8 shadow-[0_30px_60px_-45px_rgba(23,26,29,0.8)]">
      <p className="inline-flex rounded-full border border-[#d8d6ce] bg-[#f6f4ef] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#7d9b8a]">
        Reset Password
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-[#171a1d]">Set New Password</h1>
      <p className="mt-2 text-sm text-[#4c5258]">Enter your new password below.</p>

      {!submitted ? (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#3f4347]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              disabled
              value={email}
              className="w-full rounded-xl border border-[#cfccc2] bg-[#f6f4ef] px-3 py-2.5 text-[#171a1d] outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#3f4347]" htmlFor="password">
              New Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-[#cfccc2] px-3 py-2.5 text-[#171a1d] outline-none ring-[#c9ff3e] transition focus:ring"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-[#3f4347]" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              className="w-full rounded-xl border border-[#cfccc2] px-3 py-2.5 text-[#171a1d] outline-none ring-[#c9ff3e] transition focus:ring"
            />
          </div>

          <button type="submit" disabled={isLoading} className="pp-split-pill w-full justify-center">
            <span className="pp-split-pill-label">{isLoading ? "Resetting..." : "Reset Password"}</span>
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
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] px-6 py-14">
      <Suspense fallback={<div className="mx-auto w-full max-w-md">Loading...</div>}>
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}
