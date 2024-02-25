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
      // addCommonColors: true, (add tailwind colors)
      themes: {
        dark: {
          colors: {
            primary: {
              // DEFAULT: "",
              // foreground: "",
            },
            // focus: "",
          },
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
