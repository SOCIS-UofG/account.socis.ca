import { nextui } from "@nextui-org/react";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  plugins: [
    nextui({
      // set the background color to #1f1f1f;
      themes: {
        light: {
          colors: {
            background: "#1f1f1f", // or DEFAULT
          },
        },
        dark: {
          colors: {
            background: "#1f1f1f", // or DEFAULT
          },
          // ... rest of the colors
        },
      },
    }),
  ],
  theme: {
    extend: {
      colors: {
        primary: "#10b981",
        secondary: "#1f1f1f",
      },
    },
  },
};
