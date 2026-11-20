/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F1F5F9",
          hover: "#F8FAFC",
        },
        primary: {
          DEFAULT: "#0F172A", // Deep Slate 900
          light: "#1E293B",   // Slate 800
          dark: "#020617",    // Slate 950
        },
        secondary: {
          DEFAULT: "#475569", // Slate 600
          light: "#64748B",   // Slate 500
          dark: "#334155",    // Slate 700
        },
        accent: {
          DEFAULT: "#059669", // Tournament Emerald 600
          hover: "#047857",   // Emerald 700
          light: "#ECFDF5",   // Mint 50
          border: "#A7F3D0",  // Mint 200
          ring: "#10B981",    // Emerald 500
        },
        amber: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
          border: "#FDE68A",
        },
        border: {
          DEFAULT: "#E2E8F0", // Slate 200
          light: "#F1F5F9",   // Slate 100
          dark: "#CBD5E1",    // Slate 300
        },
        muted: {
          DEFAULT: "#64748B",
          light: "#94A3B8",
          dark: "#475569",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Manrope", "Inter", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 2px 6px -1px rgba(15, 23, 42, 0.02)",
        elevated: "0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.03)",
        emerald: "0 4px 14px 0 rgba(5, 150, 105, 0.18)",
      },
      borderRadius: {
        "xl": "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
