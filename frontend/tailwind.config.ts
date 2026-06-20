import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#10298a",
        "primary-container": "#2e42a1",
        "primary-fixed-dim": "#bac3ff",
        surface: "#f7f9fb",
        "surface-dim": "#d8dadc",
        "surface-bright": "#f7f9fb",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "on-surface": "#191c1e",
        "on-surface-variant": "#454652",
        "secondary-container": "#d5e3fc",
        "on-secondary-container": "#57657a",
        "outline": "#757683",
        "outline-variant": "#c5c5d4",
        "tertiary-container": "#00573a",
        "on-tertiary-container": "#40d399",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        "on-error": "#ffffff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
