"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AdminSidebar from "@/components/AdminSidebar";
import { Menu, X, Activity } from "lucide-react";

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.authenticated || data?.admin || data?.user) {
          setUser(data.user || data.admin);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router, pathname]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping"></span>
          <span className="font-semibold text-primary">Verifying administrative credentials...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full max-w-full">
      {/* Mobile Top Header (Sticky) */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-primary text-white border-b border-secondary shrink-0 w-full max-w-full">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 font-bold text-xs">
            A
          </span>
          <span className="font-heading font-black text-xs tracking-tight text-white">
            APEX ADMIN
          </span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Fixed Desktop Sidebar (Permanently pinned to the left) */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:z-30 md:flex-col border-r border-border bg-white shadow-subtle">
        <AdminSidebar user={user} />
      </aside>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-primary/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col">
            <AdminSidebar user={user} />
          </div>
        </div>
      )}

      {/* Main Content Area (offset with md:pl-64 to clear the fixed sidebar) */}
      <div className="md:pl-64 flex flex-col min-w-0 min-h-screen overflow-x-hidden w-full max-w-full">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}