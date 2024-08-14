import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import typography from '@tailwindcss/typography';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: '',
  theme: {
    // Define screen sizes for tailwind rules.
    screens: {
      mb: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      // Extra class created for larger screens.
      '2xl': '1536px',
    },
    // Define rules for spacing, animation, and other tailwind features.
    extend: {
      // Define custom spacing for tailwind rules.
      spacing: {
        120: '460px',
      },
      // Custom padding sizes based on percentages of container.
      padding: {
        p20: '20%',
        p15: '15%',
        p10: '10%',
        p5: '5%',
      },
      // Defines a custom sizing based on the bug report button.
      // Defines the size the button expands from an icon to include text.
      screens: {
        popout: '600px',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  // Define the required plugins for tailwind config.
  plugins: [tailwindcssAnimate, typography],
};

export default config;
