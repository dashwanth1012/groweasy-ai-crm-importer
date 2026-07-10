import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./hooks/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        card: "hsl(var(--card))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))"
      },
      fontFamily: {
        display: ["var(--font-clash)", "Inter", "system-ui", "sans-serif"],
        sans: ["var(--font-satoshi)", "Inter", "system-ui", "sans-serif"]
      },
      transitionTimingFunction: {
        editorial: "cubic-bezier(0.77,0,0.175,1)"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(17, 17, 17, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;

