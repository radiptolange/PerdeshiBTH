import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0E17',
        surface: '#121626',
        card: '#1A2035',
        'card-hover': '#242C48',
        'card-elevated': '#1F2742',
        border: 'rgba(255, 255, 255, 0.08)',
        'border-active': 'rgba(124, 58, 237, 0.5)',
        esports: {
          purple: '#7C3AED',
          cyan: '#06B6D4',
          emerald: '#10B981',
          crimson: '#EF4444',
          gold: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(124, 58, 237, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.4)',
        'glow-crimson': '0 0 25px -5px rgba(239, 68, 68, 0.4)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
