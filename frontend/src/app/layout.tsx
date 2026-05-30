import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export const metadata: Metadata = {
  title: "PricePulse",
  description: "Track product prices and receive alerts on price drops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable}`}>
        <header className="pp-header-wrap">
          <nav className="pp-nav-shell">
            <Link href="/" className="pp-nav-logo">
              PricePulse
            </Link>
            <div className="pp-nav-links">
              <Link href="/" className="pp-nav-link">
                Home
              </Link>
              <Link href="/dashboard" className="pp-nav-link">
                Dashboard
              </Link>
              <Link href="/login" className="pp-nav-link">
                Login
              </Link>
              <Link href="/register" className="pp-nav-link pp-nav-link-cta">
                Register
              </Link>
            </div>
          </nav>
        </header>
        <main className="pt-28 md:pt-32">{children}</main>
      </body>
    </html>
  );
}
