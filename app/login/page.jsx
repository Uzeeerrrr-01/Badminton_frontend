"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        throw new Error(res.ok ? "Authentication successful" : "Server communication error. Please try again.");
      }
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password");
      }

      window.location.href = "/admin";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-slate-50 to-background selection:bg-accent-light selection:text-accent">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand logo */}
        <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
          <div className="w-11 h-11 rounded-2xl bg-accent text-white flex items-center justify-center shadow-emerald group-hover:scale-105 transition-all">
            <svg
              className="w-6 h-6 text-white"
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
          <div className="text-left">
            <span className="font-heading font-black text-xl text-primary tracking-tight block leading-none">
              APEX OPEN
            </span>
            <span className="text-[10px] text-muted tracking-wider uppercase font-bold block mt-0.5">
              Tournament Portal
            </span>
          </div>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-heading font-black text-primary tracking-tight">
          Admin & Umpire Portal
        </h1>
        <p className="mt-1 text-xs text-secondary max-w-sm mx-auto">
          Sign in to access official live court scoring consoles, match scheduling, and tournament management.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-border shadow-elevated rounded-3xl">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 border border-border rounded-xl text-xs bg-slate-50 text-primary font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  placeholder="admin@badminton.org"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 border border-border rounded-xl text-xs bg-slate-50 text-primary font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors p-1 rounded-md"
                  title={showPassword ? "Hide password" : "Show password"}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-slate-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-hover transition-all shadow-emerald disabled:opacity-50 mt-2"
            >
              <span>{loading ? "Verifying Credentials..." : "Sign In to Management Dashboard"}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border flex items-center justify-between text-xs text-muted">
            <Link
              href="/"
              className="hover:text-primary transition-colors inline-flex items-center gap-1 font-semibold"
            >
              ← Return to Public Website
            </Link>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>TLS Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
