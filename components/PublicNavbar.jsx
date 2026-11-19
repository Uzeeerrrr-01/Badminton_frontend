"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, Menu, X, ArrowUpRight, Zap } from "lucide-react";

export default function PublicNavbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setIsAdmin(Boolean(data.authenticated || data.admin)))
      .catch(() => setIsAdmin(false));
  }, []);

  const navLinks = [
    { href: "/", label: "Overview" },
    { href: "/matches", label: "Matches & Live" },
    { href: "/players", label: "Competitors" },
    { href: "/leaderboard", label: "Standings" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white shadow-subtle group-hover:bg-primary-light transition-all">
            <svg
              className="w-5 h-5 text-accent"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V14l-4 3v3l5-1 1 2 1-2 5 1v-3l-4-3V9.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" />
            </svg>
          </div>
          <div>
            <span className="font-heading font-extrabold text-primary tracking-tight text-base sm:text-lg block leading-none">
              APEX BADMINTON
            </span>
            <span className="text-[10px] text-muted tracking-widest uppercase font-semibold block mt-0.5">
              Tournament Portal
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-50/80 p-1 rounded-xl border border-border/60">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-primary shadow-subtle font-bold"
                    : "text-muted hover:text-primary hover:bg-white/60"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-light transition-all shadow-subtle"
            >
              <Shield className="w-3.5 h-3.5 text-accent" />
              <span>Admin Console</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-white text-primary hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5 text-muted" />
              <span>Umpire Login</span>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-muted hover:text-primary hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-surface px-4 pt-2 pb-5 space-y-1 animate-in fade-in duration-150">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-slate-100 text-primary font-bold"
                    : "text-muted hover:text-primary hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="pt-3 border-t border-border mt-3">
            {isAdmin ? (
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-lg bg-primary text-white shadow-subtle"
              >
                <Shield className="w-4 h-4 text-accent" />
                Go to Admin Console
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-semibold rounded-lg border border-border text-primary bg-white shadow-2xs"
              >
                <Shield className="w-4 h-4 text-muted" />
                Umpire Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
