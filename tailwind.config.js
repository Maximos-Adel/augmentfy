/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans'],
      },

      colors: { primaryPurple: '#1E092A' },
      backgroundImage: {
        'purple-gradient':
          'linear-gradient(90deg, rgba(102,40,159,1) 0%, rgba(246,190,246,1) 66%, rgba(127,79,129,1) 100%)',
        'background-header':
          'linear-gradient(to bottom, #1d0d28, #1a0d23, #170d1e, #140c19, #100c13)',
      },
    },
  },
  plugins: [],
};
