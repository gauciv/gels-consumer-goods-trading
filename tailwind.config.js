/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Admin brand palette
        brand: {
          DEFAULT: '#1060C0',  // --brand / --primary
          dark:    '#0A2040',  // --sidebar-start
          navy:    '#0D2B52',  // --sidebar-end
          bg:      '#EEF2F7',  // --background
          surface: '#F1F5FB',  // --secondary (card/panel surface)
        },
        // Shorthand for card/panel surface (replaces bg-white throughout)
        surface: '#F1F5FB',
        // Admin blue-tinted neutral scale (replaces default grays)
        gray: {
          50:  '#EEF2F7',  // admin --background  (page roots)
          100: '#DCE8F5',  // secondary surfaces  (inputs, section heads)
          200: '#C5D8F0',  // admin --border      (card borders, dividers)
          300: '#A8BDD4',
          400: '#8AACCC',
          500: '#8FA3BE',  // admin --muted-foreground
          600: '#6A87A8',
          700: '#4A6285',
          800: '#2A4166',
          900: '#0D1F3C',  // admin --foreground
        },
        // Admin brand blue scale (replaces default blues)
        blue: {
          50:  '#E8F0FB',
          100: '#D1E2F7',
          200: '#A3C5EF',
          300: '#74A7E6',
          400: '#4689DD',
          500: '#1060C0',  // admin --brand
          600: '#0D52A8',
          700: '#0A4490',
          800: '#072D60',
          900: '#0A2040',  // admin sidebar
        },
      },
    },
  },
  plugins: [],
}
