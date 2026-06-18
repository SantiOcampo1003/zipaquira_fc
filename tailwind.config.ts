import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        rz: {
          forest: "#0B2810",
          "forest-dark": "#061A0A",
          burgundy: "#740704",
          gold: "#A99259",
          cream: "#F4EFE5",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(169,146,89,0.22), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, rgba(11,40,16,0.35), transparent 50%)",
        "gold-fade": "linear-gradient(135deg, rgba(169,146,89,0.15) 0%, transparent 50%)",
      },
      boxShadow: {
        card: "0 24px 80px -32px rgba(0,0,0,0.65), 0 0 0 1px rgba(244,239,229,0.06)",
        lift: "0 12px 40px -16px rgba(169,146,89,0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
