/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Migrado do bloco @theme inline do Tailwind v4 (globals.css).
        // Nota: os componentes usam majoritariamente valores hex arbitrarios
        // (ex: bg-[#C9A84C]); estes tokens ficam disponiveis como classes
        // semanticas (bg-gold, text-parchment, ...) para uso futuro.
        primary: { DEFAULT: "#0A0A0A", hover: "#1a1a1a" },
        gold: { DEFAULT: "#C9A84C", light: "#E2C06A", dark: "#A07D30" },
        parchment: "#F5E6C8",
        silver: "#8A8A8A",
        background: "#0A0A0A",
        surface: { DEFAULT: "#141414", 2: "#1E1E1E" },
        border: "#2A2A2A",
        foreground: "#F5E6C8",
      },
      fontFamily: {
        sans: ['"Poppins"', "sans-serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
      },
      // O Tailwind v4 aceitava qualquer % de opacidade (ex: /4, /15, /35).
      // O v3 so tem a escala fixa (0,5,10,20,25...), entao classes como
      // text-[#C9A84C]/4 eram ignoradas e a cor saia 100% opaca. Aqui
      // registramos os valores fora-da-escala usados no projeto para que
      // as classes /N voltem a funcionar como no v4, sem tocar componentes.
      opacity: {
        2: "0.02",
        3: "0.03",
        4: "0.04",
        8: "0.08",
        15: "0.15",
        35: "0.35",
        45: "0.45",
        55: "0.55",
        98: "0.98",
      },
    },
  },
  plugins: [],
};
