import Link from "next/link";
import { ShieldCheck, Trophy, Sparkles } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-border">
          {/* Brand & Format */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-black text-sm">
              🏸
            </div>
            <div>
              <span className="font-heading font-black text-primary text-sm sm:text-base tracking-tight block">
                Apex Badminton Championship
              </span>
              <p className="text-xs text-muted">
                Official regional tournament scoring engine and knockout ladder portal.
              </p>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-light text-accent border border-accent-border font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              11-Point Fast Rally
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-border font-semibold">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              Sudden Death at 14-14
            </span>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted font-medium">
          <p>© {new Date().getFullYear()} Apex Badminton Open. All tournament rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/matches" className="hover:text-primary transition-colors">
              Schedule & Fixtures
            </Link>
            <Link href="/players" className="hover:text-primary transition-colors">
              Competitor Roster
            </Link>
            <Link href="/leaderboard" className="hover:text-primary transition-colors">
              Standings
            </Link>
            <Link href="/login" className="hover:text-primary font-semibold text-primary transition-colors">
              Umpire Console
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
