/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FAF9F5',
          alt: '#FBFBF9',
          surface: '#F5F4F0',
          focus: '#EFECE6',
          hover: '#EAE6DF',
        },
        ink: {
          primary: '#191919',
          secondary: '#2D312E',
          muted: '#71717A',
          subtle: '#A1A1AA',
        },
        border: {
          subtle: '#E6E3DC',
          strong: '#DCD8CF',
        },
        brand: {
          sage: '#4C6B5B',
          sageLight: '#E4ECE7',
          amber: '#B47836',
          amberLight: '#F6EFE6',
          slate: '#3D5068',
          slateLight: '#E9EDF2',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 2px 8px -2px rgba(25, 25, 25, 0.04)',
        command: '0 12px 32px -8px rgba(25, 25, 25, 0.08)',
      }
    },
  },
  plugins: [],
}
