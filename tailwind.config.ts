import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#08080c",
          card: "#111118",
          "card-hover": "#16161f",
          elevated: "#1a1a25",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          hover: "rgba(255,255,255,0.12)",
        },
        text: {
          DEFAULT: "#e8e6e3",
          dim: "rgba(255,255,255,0.4)",
          mid: "rgba(255,255,255,0.6)",
        },
        accent: {
          DEFAULT: "#4ade80",
          dim: "rgba(74,222,128,0.12)",
        },
        block: {
          health: "#ef4444",
          work: "#f59e0b",
          development: "#8b5cf6",
          relationships: "#ec4899",
          finance: "#06b6d4",
          spirituality: "#a78bfa",
          brightness: "#f97316",
          home: "#22c55e",
        },
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
