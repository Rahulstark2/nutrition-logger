/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B12',
        surface: '#141420',
        card: '#1A1A2E',
        cardBorder: '#252540',
        accent: '#00D4AA',
        accentDim: '#00A88A',
        protein: '#22C55E',
        carbs: '#3B82F6',
        fat: '#F97316',
        textPrimary: '#EEEEF0',
        textSecondary: '#8888A0',
        textDim: '#555570',
      },
      fontFamily: {
        sans: ['System'],
      }
    },
  },
  plugins: [],
}
