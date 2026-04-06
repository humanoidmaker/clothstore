import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1a1f36",
          50: "#f0f1f5",
          100: "#d9dce6",
          200: "#b3b9cd",
          300: "#8d96b4",
          400: "#67739b",
          500: "#414f82",
          600: "#343f68",
          700: "#272f4e",
          800: "#1a1f36",
          900: "#0d101b",
        },
        accent: {
          DEFAULT: "#c8a96e",
          light: "#d4b87e",
          dark: "#b8955e",
          50: "#faf6ee",
          100: "#f2e8d0",
          200: "#e5d1a1",
          300: "#d8ba72",
          400: "#c8a96e",
          500: "#b8955e",
          600: "#a07b44",
          700: "#7d6035",
          800: "#5a4526",
          900: "#372a17",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Poppins", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceIn: {
          "0%": { opacity: "0", transform: "scale(0.3)" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
        slideUp: "slideUp 0.4s ease-out",
        slideDown: "slideDown 0.4s ease-out",
        bounceIn: "bounceIn 0.5s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
