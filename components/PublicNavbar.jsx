"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Shield, Menu, X, ArrowUpRight, Activity } from "lucide-react";

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
    { href: "/matches", label: "Matches & Live", hasBadge: true },
    { href: "/players", label: "Competitors" },
    { href: "/leaderboard", label: "Standings" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-border transition-colors w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
          <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shadow-emerald group-hover:bg-accent-hover transition-all shrink-0">
            <svg
              className="w-5 h-5 text-white"
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
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-heading font-black text-primary tracking-tight text-sm sm:text-lg block leading-none truncate max-w-[140px] xs:max-w-none">
                APEX BADMINTON
              </span>
              <span className="text-[10px] font-bold bg-accent-light text-accent border border-accent-border px-1.5 py-0.5 rounded-full shrink-0">
                OPEN
              </span>
            </div>
            <span className="text-[10px] text-muted tracking-wider uppercase font-semibold block mt-0.5 truncate">
              Official Championship Portal
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1 rounded-xl border border-border">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-primary shadow-subtle font-bold"
                    : "text-secondary hover:text-primary hover:bg-white/60"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {link.label}
                  {link.hasBadge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right CTA / Admin Access */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href={isAdmin ? "/admin" : "/login"}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-border bg-white text-secondary hover:text-primary hover:bg-slate-50 hover:border-slate-300 transition-all shadow-subtle"
          >
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>{isAdmin ? "Admin Console" : "Umpire Portal"}</span>
            <ArrowUpRight className="w-3 h-3 text-muted" />
          </Link>
        </div>

        {/* Mobile menu */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href={isAdmin ? "/admin" : "/login"}
            className="p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-slate-100 transition-colors"
            title={isAdmin ? "Admin Console" : "Umpire Portal"}
          >
            <Shield className="w-4 h-4 text-accent" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-secondary hover:text-primary hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-white/95 backdrop-blur-md px-4 pt-3 pb-4 space-y-1.5 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-accent-light text-accent font-bold"
                    : "text-secondary hover:bg-slate-50 hover:text-primary"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{link.label}</span>
                  {link.hasBadge && (
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  )}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
          <div className="pt-2.5 border-t border-border">
            <Link
              href={isAdmin ? "/admin" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold text-secondary hover:text-primary hover:bg-slate-50"
            >
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                <span>{isAdmin ? "Admin Console" : "Umpire Portal"}</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-muted" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
