/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--theme-primary)",
        ink: "#0C1222",
        slate: "#4A5568",
        soft: "#F6F3E7",
        sky: "#EAF3FA",
        warm: "#FFF3C4"
      },
      boxShadow: {
        soft: "0 8px 20px rgba(12, 18, 34, 0.08)",
        card: "0 12px 30px rgba(12, 18, 34, 0.12)"
      },
      fontFamily: {
        display: ["'Sora'", "sans-serif"],
        body: ["'Work Sans'", "sans-serif"]
      }
    }
  },
  plugins: []
};
