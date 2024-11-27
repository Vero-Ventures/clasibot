import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config = {
  darkMode: ['class'],
  content: [
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
    container: {
      center: true,
      padding: '2rem',
      screens: {
        tableMin: '320px',
        tableName: '466px',
        tableAmount: '590px',
        tableCatagories: '706px',
        tableCatConfidence: '922px',
        tableTaxCodes: '1010px',
        tableTaxConfidence: '1225px',
        '2xl': '1400px',
      },
    },
    extend: {
      // Define custom spacing for tailwind elements.
      spacing: {
        120: '460px',
      },
      // Add custom border sizing for 3 px width.
      borderWidth: {
        '3': '3px',
      },
      // Custom padding sizes based on percentages of container.
      padding: {
        p20: '20%',
        p15: '15%',
        p10: '10%',
        p5: '5%',
      },
      // Defines a custom sizing based on the bug report button.
      // Defines the screen size the button should expand from an icon to include text.
      screens: {
        popout: '600px',
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
        successAnimation: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        failureAnimation: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '70%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        successAnimation: 'successAnimation 0.5s ease-in-out forwards',
        failureAnimation: 'failureAnimation 0.5s ease-in-out forwards',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

export default config;
