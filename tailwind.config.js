/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {},
    screens: {
      xs: "320px",   // 20rem
      sm: "384px",   // 24rem
      "3xl": "768px",// 48rem
      "7xl": "1280px"// 80rem
    }
  },
  plugins: []
};
