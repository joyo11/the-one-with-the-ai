import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        accent2: "var(--accent2)",
        error: "var(--error)",
        success: "var(--success)",
      },
      fontFamily: {
        marker: ["var(--font-marker)", "cursive"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      animation: {
        "msg-in": "msgIn 0.2s ease-out both",
        "type-dot": "typedot 1.4s infinite ease-in-out",
        shimmer: "shimmer 1.6s infinite linear",
        "bm-in": "bmIn 0.08s ease-out forwards",
        "toast-in": "toastIn 0.22s cubic-bezier(.2,.7,.3,1) both",
        pop: "pop 0.32s cubic-bezier(.2,.7,.3,1) both",
        "bar-fill": "barfill 0.7s cubic-bezier(.2,.7,.3,1) both",
      },
      keyframes: {
        msgIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        typedot: {
          "0%,60%,100%": { opacity: "0.3", transform: "translateY(0)" },
          "30%": { opacity: "1", transform: "translateY(-2px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        bmIn: { to: { opacity: "1" } },
        toastIn: {
          from: { opacity: "0", transform: "translateY(-8px) scale(.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pop: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "60%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        barfill: { from: { width: "0" } },
      },
    },
  },
  plugins: [],
};

export default config;
