import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f6f8fc',
        ink: '#172033',
        muted: '#667085',
        line: '#e4e9f2',
        primary: {
          DEFAULT: '#145c9e',
          dark: '#0f3e69',
          soft: '#e8f3ff',
        },
        teal: {
          DEFAULT: '#0f766e',
          soft: '#e7f8f5',
        },
        green: {
          DEFAULT: '#15803d',
          soft: '#e9f9ef',
        },
        amber: {
          DEFAULT: '#b7791f',
          soft: '#fff4db',
        },
        red: {
          DEFAULT: '#b42318',
          soft: '#ffe9e7',
        },
        purple: {
          DEFAULT: '#6941c6',
          soft: '#f1ebff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        card: '22px',
        field: '14px',
        chip: '999px',
      },
      boxShadow: {
        soft: '0 16px 42px rgba(21, 40, 72, 0.08)',
        modal: '0 30px 80px rgba(15,23,42,.25)',
      },
    },
  },
  plugins: [],
};

export default config;
