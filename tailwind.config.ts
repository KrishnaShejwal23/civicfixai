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
        navy: {
          DEFAULT: "#10243A",
          deep: "#10243A",
          secondary: "#102D43",
          light: "#1A3957",
        },
        teal: {
          DEFAULT: "#10BFA5",
          hover: "#0DA68F",
          light: "#E7F9F6",
          dark: "#0B8573",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "#F5F7FB",
          muted: "#EEF2F6",
        },
        border: {
          DEFAULT: "#E4EAF0",
          light: "#F0F4F8",
          dark: "#CFD9E3",
        },
        civic: {
          main: "#24364A",
          secondary: "#657386",
          muted: "#8A94A6",
          border: "#E4EAF0",
          bg: "#F5F7FB",
        },
        status: {
          pending: {
            bg: "#FEF3C7",
            text: "#92400E",
            border: "#FDE68A",
            dot: "#F59E0B",
          },
          in_progress: {
            bg: "#E0F2FE",
            text: "#075985",
            border: "#BAE6FD",
            dot: "#0284C7",
          },
          resolved: {
            bg: "#D1FAE5",
            text: "#065F46",
            border: "#A7F3D0",
            dot: "#10B981",
          },
          urgent: {
            bg: "#FFE4E6",
            text: "#9F1239",
            border: "#FECDD3",
            dot: "#E11D48",
          },
          rejected: {
            bg: "#F1F5F9",
            text: "#475569",
            border: "#CBD5E1",
            dot: "#64748B",
          },
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(16, 36, 58, 0.04), 0 1px 2px -1px rgba(16, 36, 58, 0.02)",
        card: "0 4px 12px 0 rgba(16, 36, 58, 0.05), 0 1px 2px 0 rgba(16, 36, 58, 0.03)",
        elevated: "0 12px 24px -4px rgba(16, 36, 58, 0.08), 0 4px 6px -2px rgba(16, 36, 58, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
