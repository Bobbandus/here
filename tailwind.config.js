/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema-styrda tokens (se index.css för :root / [data-theme="light"]).
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        raised: 'rgb(var(--c-raised) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        text: 'rgb(var(--c-text) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        // Konstanta i båda teman.
        paper: '#f2eee2',
        accent: '#3be389',
        accentDim: '#1f9a61',
        accentInk: '#05130c',
        flare: '#ff4b3e',
        gold: '#ffce3f',
      },
      fontFamily: {
        black: ['Archivo Black', 'Archivo', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'ui-monospace', 'Menlo', 'monospace'],
        script: ['Courier Prime', 'Courier New', 'monospace'],
      },
      borderRadius: {
        btn: 'var(--radius-btn)',
        media: 'var(--radius-media)',
        panel: 'var(--radius-panel)',
      },
      transitionDuration: {
        150: '150ms',
        250: '250ms',
      },
    },
  },
  plugins: [],
};
