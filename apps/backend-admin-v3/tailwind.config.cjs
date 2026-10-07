/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/common/**/*.{js,ts,jsx,tsx,mdx}',
    './src/collections/**/*.{js,ts,jsx,tsx,mdx}',
    './src/globals/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
        tajawal: ['Tajawal', 'sans-serif'],
        urbanist: ['Urbanist', 'sans-serif'],
        gilroy: ['Gilroy-Light', 'sans-serif'],
        'gilroy-bold': ['Gilroy-ExtraBold', 'sans-serif'],
        noah: ['Noah-Regular', 'sans-serif'],
        'noah-bold': ['Noah-Bold', 'sans-serif'],
        'menu-primary': 'var(--font-menu-primary, Noah-Regular)',
        'menu-secondary': 'var(--font-menu-secondary, Baskerville)',
        'menu-tertiary': 'var(--font-menu-tertiary, Poppins)',
        'page-primary': 'var(--page-font-primary, Poppins)',
        'page-secondary': 'var(--page-font-secondary, Urbanist)',
      },
      colors: {
        'menu-primary': 'var(--primary-color)',
        'menu-primary-contrast': 'var(--primary-contrast-color)',
        'menu-background': 'var(--background-color)',
        'menu-background-card': 'var(--background-card-color)',
        'menu-text': 'var(--text-color)',
        'menu-neutral': 'var(--neutral-color)',
      },
      width: {
        25: '25%',
        33: '33.333333%',
        50: '50%',
        66: '66.666667%',
        75: '75%',
        100: '100%',
      },
    },
  },
  safelist: [
    {
      pattern: /w-(25|33|50|66|75|100)/,
    },
    // Add patterns for menu colors and fonts
    {
      pattern: /bg-menu-(background|background-card|primary|primary-contrast|neutral)/,
    },
    {
      pattern: /text-menu-(text|primary|neutral)/,
    },
    {
      pattern: /border-menu-(neutral|primary)/,
    },
    {
      pattern: /font-menu-(primary|secondary)/,
    },
    // Add patterns for custom page fonts (when users upload custom fonts)
    {
      pattern: /font-page-(primary|secondary)/,
    },    
  ],
  plugins: [require('daisyui')],
  daisyui: {
    themes: false, // We define themes in styles.css using @plugin "daisyui/theme"
    logs: false,
  },
}
