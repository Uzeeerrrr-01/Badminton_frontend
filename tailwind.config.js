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
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#101C2B", // Deep Navy
          light: "#172033",
          dark: "#0A121C",
        },
        secondary: {
          DEFAULT: "#171C24", // Charcoal
          light: "#232A36",
          dark: "#0F1217",
        },
        accent: {
          DEFAULT: "#14B8A6", // Teal
          hover: "#0D9488",
          light: "#F0FDFA",
          border: "#99F6E4",
        },
        border: "#E9EEF3",
        muted: {
          DEFAULT: "#64748B",
          light: "#94A3B8",
          dark: "#475569",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        heading: ["Manrope", "Inter", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(16, 28, 43, 0.04)",
        card: "0 1px 3px 0 rgba(16, 28, 43, 0.05), 0 1px 2px -1px rgba(16, 28, 43, 0.05)",
        elevated: "0 10px 25px -5px rgba(16, 28, 43, 0.07), 0 8px 10px -6px rgba(16, 28, 43, 0.03)",
        glow: "0 0 15px -3px rgba(20, 184, 166, 0.25)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
