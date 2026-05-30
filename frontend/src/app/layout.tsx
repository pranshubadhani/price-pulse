import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
