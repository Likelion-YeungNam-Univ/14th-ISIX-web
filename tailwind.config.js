/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 브랜드
        bg: '#0D0D0F',
        card: '#17171B',
        border: '#2A2A30',
        text: '#F2EFE9',
        'text-sub': '#8C8880',
        gold: '#C9A96A',

        // 히트맵 — 임의로 바꾸지 않습니다
        fit: {
          loose: '#2E86C1',
          good: '#27AE60',
          tight: '#C0392B',
        },
      },
    },
  },
  plugins: [],
};
