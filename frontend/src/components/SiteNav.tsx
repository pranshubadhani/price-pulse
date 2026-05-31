"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type NavItem = {
  href: string;
  label: string;
  cta?: boolean;
};

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isReady, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const loggedOutLinks: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/auth", label: "Get Started", cta: true },
  ];

  const loggedInLinks: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
  ];

  const links = isAuthenticated ? loggedInLinks : loggedOutLinks;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push("/");
  };

  return (
    <header className="pp-header-wrap">
      <nav className="pp-nav-shell" aria-label="Primary">
        <div className="pp-nav-top-row">
          <Link href="/" className="pp-nav-logo">
            <Image
              src="/pricepulse-logo.png"
              alt="PricePulse logo"
              width={38}
              height={38}
              className="pp-nav-logo-image"
              priority
            />
            <span className="pp-nav-logo-text">PricePulse</span>
          </Link>

          <button
            type="button"
            className="pp-nav-toggle"
            aria-expanded={isOpen}
            aria-controls="pp-mobile-menu"
            aria-label="Toggle navigation menu"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <span className="pp-nav-toggle-line" />
            <span className="pp-nav-toggle-line" />
            <span className="pp-nav-toggle-line" />
          </button>
        </div>

        <div className="pp-nav-links" role="list">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`pp-nav-link ${link.cta ? "pp-nav-link-cta" : ""}`.trim()}
            >
              {link.label}
            </Link>
          ))}
          {isReady && isAuthenticated ? (
            <button type="button" className="pp-nav-link" onClick={handleLogout}>
              Logout
            </button>
          ) : null}
        </div>

        {isOpen ? (
          <div id="pp-mobile-menu" className="pp-nav-mobile-menu" role="list">
            {links.map((link) => (
              <Link
                key={`mobile-${link.href}`}
                href={link.href}
                className={`pp-nav-mobile-link ${link.cta ? "pp-nav-mobile-link-cta" : ""}`.trim()}
              >
                {link.label}
              </Link>
            ))}
            {isReady && isAuthenticated ? (
              <button
                type="button"
                className="pp-nav-mobile-link"
                onClick={handleLogout}
              >
                Logout
              </button>
            ) : null}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
