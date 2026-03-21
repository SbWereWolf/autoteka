/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    // Custom screens must match the spec (rem values shown in comments)
    screens: {
      sm: "24rem",   // 384px
      "3xl": "48rem",// 768px
      "7xl": "80rem" // 1280px
    },
    extend: {}
  },
  plugins: []
};
