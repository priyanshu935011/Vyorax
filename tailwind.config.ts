import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/ui/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        obsidian: "var(--obsidian)",
        charcoal: "var(--charcoal)",
        carbon: "var(--carbon)",
        steel: "var(--steel)",
        ash: "var(--ash)",
        smoke: "var(--smoke)",
        silver: "var(--silver)",
        chalk: "var(--chalk)",
        white: "var(--white)",
        agni: {
          DEFAULT: "var(--agni)",
          light: "var(--agni-light)",
          deep: "var(--agni-deep)",
          glow: "var(--agni-glow)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          light: "var(--gold-light)",
        },
        forest: "var(--forest)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        'agni-glow': '0 0 15px rgba(178, 86, 13, 0.15)',
        'gold-glow': '0 0 15px rgba(102, 0, 0, 0.15)',
      }
    },
  },
  plugins: [],
};
export default config;
