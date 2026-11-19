import "./globals.css";

export const metadata = {
  title: "Apex Badminton Open 2026 | Live Tournament Portal",
  description: "Official Badminton Tournament Management Portal with real-time scoring, knockout brackets, and player leaderboards.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans bg-background text-primary">
        {children}
      </body>
    </html>
  );
}
