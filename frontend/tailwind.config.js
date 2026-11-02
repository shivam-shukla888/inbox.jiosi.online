/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          DEFAULT: '#6366F1',
        },
        action: {
          urgent: '#EF4444',
          urgentHover: '#DC2626',
          urgentLight: '#FEF2F2',
          urgentBorder: '#FCA5A5',
          urgentDark: '#7F1D1D',
          urgentDarkBg: '#450A0A',
          unread: '#3B82F6',
          starred: '#F59E0B',
          success: '#10B981',
          ai: '#8B5CF6',
        },
        // Semantic surfaces that adapt cleanly
        canvas: {
          DEFAULT: '#F8FAFC',
          alt: '#FFFFFF',
          surface: '#F1F5F9',
          border: '#E2E8F0',
          dark: '#0B0F17',
          darkAlt: '#111827',
          darkSurface: '#1E293B',
          darkBorder: '#334155',
        },
        ink: {
          primary: '#0F172A',
          secondary: '#334155',
          muted: '#64748B',
          subtle: '#94A3B8',
          darkPrimary: '#F8FAFC',
          darkSecondary: '#E2E8F0',
          darkMuted: '#94A3B8',
          darkSubtle: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 2px 8px -2px rgba(15, 23, 42, 0.06)',
        dropdown: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
        modal: '0 20px 40px -15px rgba(15, 23, 42, 0.25)',
      }
    },
  },
  plugins: [],
}
