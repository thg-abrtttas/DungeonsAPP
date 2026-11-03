import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#fdfbf7',
          100: '#faf5eb',
          200: '#f5ead7',
          300: '#eedcc3',
          400: '#e4c9a4',
          500: '#d8b382',
          600: '#c89a6a',
          700: '#b07d56',
          800: '#936449',
          900: '#7a523e',
          950: '#41281c',
        },
        ink: {
          50: '#f0f0f0',
          100: '#e0e0e0',
          200: '#c8c8c8',
          300: '#a8a8a8',
          400: '#888888',
          500: '#6b6b6b',
          600: '#555555',
          700: '#444444',
          800: '#333333',
          900: '#262626',
          950: '#171717',
        },
        candlelight: {
          50: '#fffdf5',
          100: '#fff9e6',
          200: '#fff0c2',
          300: '#ffe28a',
          400: '#ffd152',
          500: '#ffc024',
          600: '#e89f1a',
          700: '#c07815',
          800: '#9b5c14',
          900: '#7d4a13',
          950: '#432308',
        },
        dice: {
          ivory: '#faf8f3',
          pearl: '#f0ebe0',
          shadow: '#3d352d',
        },
      },
      fontFamily: {
        narrative: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        handwritten: ['"Comic Sans MS"', 'cursive', 'sans-serif'],
        mono: ['"SF Mono"', 'Monaco', 'Inconsolata', 'monospace'],
      },
      backgroundImage: {
        'parchment-texture': "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 400 400\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\" opacity=\"0.03\"/%3E%3C/svg%3E')",
      },
    },
  },
  plugins: [],
};
export default config;