/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary:          '#A855F7',
        'primary-dark':   '#7E22CE',
        secondary:        '#EC4899',
        'grad-start':     '#8B5CF6',
        'grad-end':       '#EC4899',
        background:       '#FFF8FC',
        surface:          '#FFFFFF',
        border:           '#F3E8FF',
        'text-primary':   '#1F2937',
        'text-secondary': '#6B7280',
        success:          '#86EFAC',
        warning:          '#FBBF24',
        error:            '#FB7185',
        period:           '#FB7185',
        fertile:          '#86EFAC',
        ovulation:        '#A855F7',
        intimacy:         '#EC4899',
      },
      borderRadius: {
        card:   24,
        button: 28,
        chip:   20,
        input:  16,
      },
      fontFamily: {
        regular:  ['Poppins_400Regular'],
        medium:   ['Poppins_500Medium'],
        semibold: ['Poppins_600SemiBold'],
        bold:     ['Poppins_700Bold'],
      },
    },
  },
  plugins: [],
};
