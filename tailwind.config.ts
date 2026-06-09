import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F5A524",
          50: "#FEF9EE",
          100: "#FDF0D4",
          200: "#FBDEA3",
          300: "#F8C668",
          400: "#F5A524",
          500: "#E8900A",
          600: "#C97007",
          700: "#A4530A",
          800: "#864210",
          900: "#6F3811",
        },
        sidebar: "#FFFFFF",
      },
    },
  },
  plugins: [],
};
export default config;
