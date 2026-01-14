/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blue': 'var(--tema-primaria)',
        'blue-scale': {
          '70': 'var(--tema-primaria)',
          '100': 'var(--tema-primaria)',
          '2-10': 'rgba(5, 35, 112, 0.1)',
        },
        'yellow': 'var(--tema-secundaria)',
        'yellow-50': 'color-mix(in srgb, var(--tema-secundaria) 50%, white)',
        'white-125': 'rgba(255, 255, 255, 0.125)',
        'gray-scale': {
          '100': 'var(--tema-fundo)',
          '700': 'var(--tema-texto-secundario)',
          '950': 'var(--tema-texto)',
        },
        'grey-scale': {
          '900': 'var(--tema-texto)',
        },
        'white-scale': {
          '0': 'var(--tema-fundo-secundario)',
        },
        'tema': {
          'primaria': 'var(--tema-primaria)',
          'secundaria': 'var(--tema-secundaria)',
          'acento': 'var(--tema-acento)',
          'sucesso': 'var(--tema-sucesso)',
          'texto': 'var(--tema-texto)',
          'texto-secundario': 'var(--tema-texto-secundario)',
          'texto-link': 'var(--tema-texto-link)',
          'texto-paragrafo': 'var(--tema-texto-paragrafo)',
          'texto-titulo': 'var(--tema-texto-titulo)',
          'fundo': 'var(--tema-fundo)',
          'fundo-secundario': 'var(--tema-fundo-secundario)',
        },
      },
      fontFamily: {
        'sora': ['Sora', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
