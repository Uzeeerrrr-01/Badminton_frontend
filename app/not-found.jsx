import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-heading font-black text-2xl mb-4 border border-teal-200">
        404
      </div>
      <h1 className="text-2xl font-heading font-black text-primary tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-xs text-muted max-w-sm mb-6">
        The tournament page or match console you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-secondary transition-colors"
      >
        Return to Tournament Home
      </Link>
    </div>
  );
}
