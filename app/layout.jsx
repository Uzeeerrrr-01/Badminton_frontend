import "./globals.css";

export const metadata = {
  title: "Apex Badminton Open 2026 | Live Tournament Portal",
  description: "Official Badminton Tournament Management Portal with real-time scoring, knockout brackets, and player leaderboards.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="min-h-screen flex flex-col font-sans bg-background text-primary overflow-x-hidden w-full max-w-full">
        {children}
      </body>
    </html>
  );
}
