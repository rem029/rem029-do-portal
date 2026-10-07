import { ROOT_KEYS } from "./src/components/form/menu/store";

const cssVars = Object.values(ROOT_KEYS);

const varClasses = cssVars.flatMap((v) => [
  `bg-[var(${v})]`,
  `text-[var(${v})]`,
  `border-[var(${v})]`,
  `outline-[var(${v})]`,
  `fill-[var(${v})]`,
  `stroke-[var(${v})]`,
  `ring-[var(${v})]`,
  `font-[var(${v})]`,
]);

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,css,tsx}"],
  safelist: [{ pattern: /(ml|pl)-\d+/ }, ...varClasses],
  theme: {
    extend: {
      fontFamily: {
        "Gilroy-Light": ["Gilroy-Light", "sans-serif"],
        "Gilroy-ExtraBold": ["Gilroy-ExtraBold", "sans-serif"],
        Urbanist: ["Urbanist", "sans-serif"],
        Poppins: ["Poppins", "sans-serif"],

        "Noto-Color-Emoji": ["Noto Color Emoji, Gilroy-Light", "sans-serif"],
        "Noah-Bold": ["Noah-Bold", "sans-serif"],
        "Noah-Regular": ["Noah-Regular", "sans-serif"],
        "Noah-RegularItalic": ["Noah-RegularItalic", "sans-serif"],
        Baskerville: ["Baskerville", "serif"],
        "Baskerville-Italic": ["Baskerville-Italic", "serif"],
        "menu-primary": `var(${ROOT_KEYS.FONT_PRIMARY}, 'Poppins')`,
        "menu-secondary": `var(${ROOT_KEYS.FONT_SECONDARY}, 'Urbanist')`,
      },
      colors: {
        "menu-primary": `var(${ROOT_KEYS.PRIMARY})`,
        "menu-primary-contrast": `var(${ROOT_KEYS.PRIMARY_CONTRAST})`,
        "menu-background": `var(${ROOT_KEYS.BACKGROUND})`,
        "menu-background-card": `var(${ROOT_KEYS.BACKGROUND_CARD})`,
        "menu-text": `var(${ROOT_KEYS.TEXT})`,
        "menu-neutral": `var(${ROOT_KEYS.NEUTRAL})`,
      },
      backgroundColor: {
        "menu-primary": `var(${ROOT_KEYS.PRIMARY})`,
        "menu-primary-contrast": `var(${ROOT_KEYS.PRIMARY_CONTRAST})`,
        "menu-background": `var(${ROOT_KEYS.BACKGROUND})`,
        "menu-background-card": `var(${ROOT_KEYS.BACKGROUND_CARD})`,
        "menu-text": `var(${ROOT_KEYS.TEXT})`,
        "menu-neutral": `var(${ROOT_KEYS.NEUTRAL})`,
      },
      textColor: {
        "menu-primary": `var(${ROOT_KEYS.PRIMARY})`,
        "menu-primary-contrast": `var(${ROOT_KEYS.PRIMARY_CONTRAST})`,
        "menu-background": `var(${ROOT_KEYS.BACKGROUND})`,
        "menu-background-card": `var(${ROOT_KEYS.BACKGROUND_CARD})`,
        "menu-text": `var(${ROOT_KEYS.TEXT})`,
        "menu-neutral": `var(${ROOT_KEYS.NEUTRAL})`,
      },
      borderColor: {
        "menu-primary": `var(${ROOT_KEYS.PRIMARY})`,
        "menu-primary-contrast": `var(${ROOT_KEYS.PRIMARY_CONTRAST})`,
        "menu-background": `var(${ROOT_KEYS.BACKGROUND})`,
        "menu-background-card": `var(${ROOT_KEYS.BACKGROUND_CARD})`,
        "menu-text": `var(${ROOT_KEYS.TEXT})`,
        "menu-neutral": `var(${ROOT_KEYS.NEUTRAL})`,
      },
    },
  },
  daisyui: {
    themes: [
      {
        printemps: {
          primary: "#00D072",
          secondary: "#E5B420",
          accent: "#d6d3d1",
          neutral: "#ffffff",
          "base-100": "#f3f4f6",
          info: "#9ca3af",
          success: "#4ade80",
          warning: "#eab308",
          error: "#dc2626",
        },
      },
      {
        dohaoasis: {
          primary: "#C7A965",
          secondary: "#202B4E",
          accent: "#d6d3d1",
          neutral: "#ffffff",
          "base-100": "#f3f4f6",
          info: "#9ca3af",
          success: "#4ade80",
          warning: "#eab308",
          error: "#dc2626",
        },
      },
      {
        "dohaoasis-new": {
          primary: "#143422",
          secondary: "#CBB263",
          accent: "#d6d3d1",
          neutral: "#ffffff",
          "base-100": "#f3f4f6",
          info: "#9ca3af",
          success: "#4ade80",
          warning: "#eab308",
          error: "#dc2626",
        },
      },
      {
        "dohaoasis-alt": {
          primary: "#202B4E",
          secondary: "#C7A965",
          accent: "#d6d3d1",
          neutral: "#ffffff",
          "base-100": "#f3f4f6",
          info: "#9ca3af",
          success: "#4ade80",
          warning: "#eab308",
          error: "#dc2626",
        },
      },
      {
        dohaquest: {
          primary: "#520B75",
          secondary: "#F2B02D",
          accent: "#d6d3d1",
          neutral: "#ffffff",
          "base-100": "#f3f4f6",
          info: "#9ca3af",
          success: "#4ade80",
          warning: "#eab308",
          error: "#dc2626",
        },
      },
    ],
  },
  plugins: [require("daisyui")],
};
