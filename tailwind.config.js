/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // थीम रंग CSS वेरिएबल से आते हैं (Admin > CMS सेटिंग्स में बदले जा सकते हैं)
        brand: 'rgb(var(--brand-rgb) / <alpha-value>)',
        ink: 'rgb(var(--ink-rgb) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'serif'],
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
      },
      animation: { marquee: 'marquee 60s linear infinite' },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
