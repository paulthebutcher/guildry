import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "accent-scout": "#b45309",
        "accent-compass": "#4f46e5",
        "accent-blueprint": "#0d9488",
        "accent-bench": "#dc2626",
        "accent-relay": "#7c3aed",
        "accent-retro": "#db2777",
        "accent-proof": "#059669",
      },
    },
  },
  plugins: [],
} satisfies Config;
