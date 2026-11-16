/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A1220',
          dark: '#070C16',
          secondary: '#101C30',
          input: '#0D1829',
        },
        accent: {
          DEFAULT: '#FF6A2B',
          hover: '#E5581B',
          glow: 'rgba(255, 106, 43, 0.25)',
        },
        ink: {
          DEFAULT: '#EEF3FB',
          soft: '#9FB0C8',
          muted: '#64748B',
        },
        risk: {
          low: '#22C55E',
          moderate: '#FACC15',
          high: '#FB923C',
          critical: '#EF4444',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          border: 'rgba(255, 255, 255, 0.12)',
          hover: 'rgba(255, 255, 255, 0.10)',
        }
      },
      fontFamily: {
        sans: [
          'Manrope',
          'Noto Sans Devanagari',
          'Noto Sans Tamil',
          'Noto Sans Telugu',
          'Noto Sans Malayalam',
          'Noto Sans Kannada',
          'system-ui',
          'sans-serif'
        ],
      },
    },
  },
  plugins: [],
}
