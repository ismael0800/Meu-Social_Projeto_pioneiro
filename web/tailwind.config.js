/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'roxo-profundo': '#4A0B59',
        'rosa': '#FF007F', // Mais puxado para rosa brilhante
        'azul-royal': '#283593',
        'ciano': '#00E5FF', // Mais vibrante
        'verde-sucesso': '#00843D',
        'superficie': '#F8FAFC',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
