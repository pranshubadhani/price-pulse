import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import SiteNav from "@/components/SiteNav";
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
  icons: {
    icon: "/pricepulse-logo.png",
    shortcut: "/pricepulse-logo.png",
    apple: "/pricepulse-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable}`}>
        <AuthProvider>
          <SiteNav />
          <main className="pt-24 md:pt-28">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
