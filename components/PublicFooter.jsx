import Link from "next/link";
import { ShieldCheck, Trophy, ArrowUpRight } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white mt-auto w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 sm:pb-8 border-b border-border text-center sm:text-left">
          {/* Brand & Format */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center font-black text-lg shadow-emerald shrink-0">
              🏸
            </div>
            <div>
              <span className="font-heading font-black text-primary text-base sm:text-lg tracking-tight block">
                Apex Badminton Championship
              </span>
              <p className="text-xs text-muted mt-0.5">
                Official regional tournament scoring engine and knockout ladder portal.
              </p>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent-light text-accent border border-accent-border font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              11-Point Fast Rally
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-border font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Sudden Death at 14-14
            </span>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted font-medium text-center sm:text-left">
          <p>© {new Date().getFullYear()} Apex Badminton Open. All tournament rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <Link
              href="/matches"
              className="px-3 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-slate-100 transition-colors"
            >
              Schedule & Fixtures
            </Link>
            <Link
              href="/players"
              className="px-3 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-slate-100 transition-colors"
            >
              Competitor Roster
            </Link>
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 rounded-lg text-secondary hover:text-primary hover:bg-slate-100 transition-colors"
            >
              Standings
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 rounded-lg font-bold text-accent bg-accent-light border border-accent-border hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
            >
              <span>Umpire Console</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
