/** @type {import('tailwindcss').Config} */
export default {
  // 💡 เพิ่มบรรทัดนี้เพื่อให้สลับโหมดผ่าน Class ใน App.jsx ได้
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}