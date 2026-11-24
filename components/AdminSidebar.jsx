"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Users,
  UserCheck,
  Calendar,
  Activity,
  Trophy,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
} from "lucide-react";

export default function AdminSidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const navItems = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/rounds", label: "Round Management", icon: Layers, highlight: true },
    { href: "/admin/players", label: "Players", icon: Users },
    { href: "/admin/teams", label: "Teams", icon: UserCheck },
    { href: "/admin/matches", label: "Matches", icon: Calendar },
    { href: "/admin/scoring", label: "Live Scoring", icon: Activity, highlight: true },
    { href: "/admin/points", label: "Points & Leaderboard", icon: Trophy },
    { href: "/admin/settings", label: "Tournament Settings", icon: Settings },
  ];

  return (
    <div className="w-full h-full bg-white flex flex-col justify-between shrink-0 select-none overflow-hidden">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-border flex items-center justify-between bg-white text-primary shrink-0">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold shadow-emerald">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V14l-4 3v3l5-1 1 2 1-2 5 1v-3l-4-3V9.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-sm tracking-tight block text-primary leading-none">
                  APEX OPEN
                </span>
                <span className="text-[9px] font-bold bg-accent-light text-accent px-1 rounded">
                  ADMIN
                </span>
              </div>
              <span className="text-[10px] text-muted font-medium tracking-wide uppercase">
                Tournament Umpire
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items (Scrollable in middle) */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-accent text-white shadow-emerald font-bold"
                    : "text-secondary hover:text-primary hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-primary"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center">
                  {item.highlight && !isActive && (
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer & User Info */}
      <div className="p-4 border-t border-border space-y-3 bg-slate-50/50 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 text-xs font-medium text-secondary hover:text-primary hover:bg-white rounded-lg transition-colors border border-border shadow-subtle"
        >
          <span className="font-semibold">Public Spectator Portal</span>
          <ExternalLink className="w-3.5 h-3.5 text-muted" />
        </Link>

        <div className="flex items-center justify-between pt-1">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-bold text-primary truncate">
              {user?.name || "Tournament Director"}
            </p>
            <p className="text-[10px] text-muted truncate">
              {user?.email || "admin@badminton.org"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 text-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
