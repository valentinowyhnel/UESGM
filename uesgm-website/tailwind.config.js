/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        transparent: 'transparent',
        current: 'currentColor',
        black: '#000',
        white: '#fff',
        // Couleur principale - Bleu accessible
        primary: {
          DEFAULT: 'hsl(220, 80%, 50%)', // Bleu légèrement plus doux pour réduire la fatigue oculaire
          foreground: 'hsl(0, 0%, 100%)',
          light: 'hsl(220, 80%, 98%)',
          dark: 'hsl(220, 80%, 40%)',
          50: 'hsl(220, 80%, 99%)',
          100: 'hsl(220, 80%, 97%)',
          200: 'hsl(220, 80%, 90%)',
          300: 'hsl(220, 80%, 80%)',
          400: 'hsl(220, 80%, 65%)',
          500: 'hsl(220, 80%, 50%)',
          600: 'hsl(220, 80%, 40%)',
          700: 'hsl(220, 80%, 30%)',
          800: 'hsl(220, 80%, 20%)',
          900: 'hsl(220, 80%, 15%)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        // Or - Contraste amélioré pour le texte
        gold: {
          DEFAULT: 'hsl(40, 100%, 50%)', // Or légèrement plus chaud
          light: 'hsl(40, 100%, 90%)',
          dark: 'hsl(40, 100%, 40%)',
          50: 'hsl(45, 100%, 98%)',
          100: 'hsl(45, 100%, 95%)',
          200: 'hsl(45, 100%, 85%)',
          300: 'hsl(45, 100%, 75%)',
          400: 'hsl(45, 100%, 65%)',
          500: 'hsl(40, 100%, 50%)',
          600: 'hsl(40, 100%, 42%)',
          700: 'hsl(40, 100%, 35%)',
          800: 'hsl(40, 100%, 25%)',
          900: 'hsl(40, 100%, 15%)',
        },
        // Jaune - Moins agressif, meilleur contraste
        yellow: {
          DEFAULT: 'hsl(48, 96%, 53%)', // Jaune plus doux
          light: 'hsl(48, 96%, 90%)',
          dark: 'hsl(48, 96%, 40%)',
          50: 'hsl(48, 100%, 96%)',
          100: 'hsl(48, 100%, 92%)',
          200: 'hsl(48, 96%, 85%)',
          300: 'hsl(48, 96%, 75%)',
          400: 'hsl(48, 96%, 65%)',
          500: 'hsl(48, 96%, 53%)',
          600: 'hsl(48, 96%, 45%)',
          700: 'hsl(48, 96%, 35%)',
          800: 'hsl(48, 96%, 25%)',
          900: 'hsl(48, 96%, 15%)',
        },
        // Couleurs de base accessibles
        background: 'hsl(0, 0%, 100%)', // Fond blanc pur pour un meilleur contraste
        foreground: 'hsl(222, 47%, 11%)', // Noir bleuté pour le texte principal
        border: 'hsl(214, 32%, 91%)', // Bordure légère pour la délimitation
        input: 'hsl(0, 0%, 100%)', // Fond blanc pour les champs de saisie
        ring: 'hsl(220, 80%, 60%)', // Couleur de focus visible
        // Texte secondaire avec contraste amélioré
        muted: {
          DEFAULT: 'hsl(210, 20%, 98%)',
          foreground: 'hsl(215, 16%, 47%)', // Gris plus foncé pour le texte secondaire
        },
        // Accent - Utilisation de l'or pour les éléments interactifs
        accent: {
          DEFAULT: 'hsl(40, 100%, 50%)', // Or
          foreground: 'hsl(0, 0%, 100%)', // Texte blanc pour contraste
        },
        // Couleur de destruction (rouge) avec contraste amélioré
        destructive: {
          DEFAULT: 'hsl(0, 84%, 60%)', // Rouge vif pour la visibilité
          foreground: 'hsl(0, 0%, 100%)', // Texte blanc pour contraste
        },
        // Cartes avec fond légèrement teinté
        card: {
          DEFAULT: 'hsl(0, 0%, 100%)', // Blanc pur pour les cartes
          foreground: 'hsl(222, 47%, 11%)', // Texte sombre pour contraste
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        serif: ['var(--font-serif)', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('tailwindcss-animate'),
  ],
  future: {
    hoverOnlyWhenSupported: true,
  }
}
