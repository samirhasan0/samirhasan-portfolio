import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Height-based breakpoints: small phones and phones held sideways
      screens: {
        short: { raw: '(max-height: 640px)' },
        squat: { raw: '(max-height: 480px)' },
      },
      colors: {
        bg: {
          DEFAULT: '#00030B',
          2: '#030B1C',
          3: '#071631',
        },
        ink: {
          DEFAULT: '#E9F2FF',
          2: '#A3B8DA',
          3: '#5F769C',
          4: '#344769',
        },
        line: {
          DEFAULT: 'rgba(150,190,255,0.10)',
          2: 'rgba(150,190,255,0.18)',
          3: 'rgba(150,190,255,0.32)',
        },
        accent: {
          DEFAULT: '#8CCBFF',
          2: '#CDE9FF',
          deep: '#2F7BFF',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
