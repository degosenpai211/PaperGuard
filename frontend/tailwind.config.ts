import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#4F46E5",
          dark: "#3730A3",
          light: "#818CF8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
