/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', "serif"],
        sans: ['Inter', "system-ui", "sans-serif"],
        mono: ['"Fira Code"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        cosmic: {
          bg0: "var(--bg-0)",
          bg1: "var(--bg-1)",
          text1: "var(--text-1)",
          text2: "var(--text-2)",
          accent1: "var(--accent-1)",
          accent2: "var(--accent-2)",
          accent3: "var(--accent-3)",
          success: "var(--success)",
          warning: "var(--warning)",
          error: "var(--error)",
          info: "var(--info)",
        }
      },
      boxShadow: {
        smd: "var(--shadow-sm)",
        cmd: "var(--shadow-md)",
        glow: "var(--shadow-glow)",
      },
      borderRadius: {
        smd: "var(--radius-sm)",
        mdd: "var(--radius-md)",
        lgd: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      spacing: {
        1.5: "var(--space-2)",
        2.5: "var(--space-3)",
        3.5: "var(--space-4)",
        5.5: "var(--space-5)",
        7.5: "var(--space-6)",
        12: "var(--space-7)"
      },
    },
  },
  plugins: [],
}
