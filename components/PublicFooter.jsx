import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-heading font-bold text-primary text-sm">
            Apex Badminton Championship
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span>Official Regional Tour</span>
          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
          <span className="text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
            11-Point Fast Rally Rules
          </span>
        </div>
        <div className="flex items-center gap-6 font-medium">
          <Link href="/matches" className="hover:text-primary transition-colors">
            Match Schedule
          </Link>
          <Link href="/players" className="hover:text-primary transition-colors">
            Player Roster
          </Link>
          <Link href="/leaderboard" className="hover:text-primary transition-colors">
            Leaderboard
          </Link>
          <Link href="/login" className="hover:text-primary transition-colors font-semibold text-primary">
            Umpire Console
          </Link>
        </div>
      </div>
    </footer>
  );
}
