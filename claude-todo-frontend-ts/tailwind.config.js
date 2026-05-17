/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    screens: {
      xs:  "420px",
      sm:  "640px",
      md:  "768px",
      lg:  "1024px",
      xl:  "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // ── Dark base palette ──────────────────────────────
        surface: {
          950: "#0d0f14",   // darkest bg
          900: "#13161d",   // page bg
          800: "#1a1e28",   // card bg
          700: "#222738",   // elevated card
          600: "#2c3347",   // border / hover
          500: "#3b4260",   // muted borders
        },
        // ── Accent: warm amber ─────────────────────────────
        accent: {
          DEFAULT: "#e8a045",
          50:  "#fef8ec",
          100: "#fdeec9",
          200: "#fbd98e",
          300: "#f8be52",
          400: "#f5a327",
          500: "#e8a045",
          600: "#d4841a",
          700: "#b06212",
          800: "#8e4c13",
          900: "#743f14",
        },
        // ── Semantic status ───────────────────────────────
        status: {
          pending:     "#6b7bab",
          in_progress: "#e8a045",
          done:        "#4caf82",
        },
        priority: {
          low:    "#6b7bab",
          medium: "#e8a045",
          high:   "#e05a5a",
        },
      },
      fontFamily: {
        display: ["'Syne'", "sans-serif"],
        body:    ["'DM Sans'", "sans-serif"],
        mono:    ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card:   "0 2px 16px rgba(0,0,0,0.45)",
        accent: "0 0 24px rgba(232,160,69,0.2)",
        danger: "0 0 24px rgba(224,90,90,0.2)",
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease",
        "slide-up":   "slideUp 0.25s ease",
        "scale-in":   "scaleIn 0.2s ease",
        "shake":      "shake 0.35s ease",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        scaleIn: { from: { opacity: "0", transform: "scale(0.95)" }, to: { opacity: "1", transform: "scale(1)" } },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-5px)" },
          "40%, 80%": { transform: "translateX(5px)" },
        },
      },
    },
  },
  plugins: [],
};