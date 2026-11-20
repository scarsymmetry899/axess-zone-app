/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#ffffff',
        card: '#111111',
        surface: '#111111',
        'card-border': '#212121',
        'text-secondary': '#848484',
        axess: {
          void: '#000000',
          bg: '#0A0A0C',
          card: '#111111',
          nested: '#161616',
          border: '#212121',
          hairline: '#262626',
          white: '#FFFFFF',
          muted: '#848484',
          dim: '#606060',
        }
      },
      fontFamily: {
        heading: ['Lexend', '"Space Grotesk"', 'sans-serif'],
        body: ['Poppins', 'Inter', 'sans-serif'],
        logo: ['Lexend', 'sans-serif'],
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Poppins', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-pill': 'inset 0 1px 0 rgba(255,255,255,0.40), inset 1px 0 0 rgba(255,255,255,0.32), inset 0 -1px 1px rgba(0,0,0,0.13), inset -1px 0 1px rgba(0,0,0,0.11)',
        'glass-search': 'inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 1px rgba(0,0,0,0.13)',
        'modal': '0 25px 50px -12px rgba(0, 0, 0, 0.95)',
      }
    },
  },
  plugins: [],
}
