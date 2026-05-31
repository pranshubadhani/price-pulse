"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/login", label: "Login" },
  { href: "/register", label: "Register", cta: true },
];

export default function SiteNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="pp-header-wrap">
      <nav className="pp-nav-shell" aria-label="Primary">
        <div className="pp-nav-top-row">
          <Link href="/" className="pp-nav-logo">
            PricePulse
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
          </div>
        ) : null}
      </nav>
    </header>
  );
}
