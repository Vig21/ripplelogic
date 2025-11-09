/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#06b6d4',
        secondary: '#a855f7',
        // Neon/cyber accents
        neon: {
          blue: '#7DF9FF',
          purple: '#A78BFA',
          pink: '#FF2D95',
          green: '#00FFA3',
          cyan: '#22D3EE',
          yellow: '#FDE047',
        },
        // Polymarket-inspired palette
        pm: {
          blue: '#2FE3FF',
          teal: '#00FFC2',
          navy: '#0B1220',
          slate: '#0F172A',
        },
        surface: {
          900: '#0b1220',
          800: '#0f172a',
          700: '#111827',
        },
      },
      boxShadow: {
        glow: '0 0 20px rgba(167, 139, 250, 0.35), 0 0 40px rgba(34, 211, 238, 0.25)',
        'inner-glow': 'inset 0 0 20px rgba(167, 139, 250, 0.15)',
        'soft': '0 8px 30px rgba(0,0,0,0.35)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'radial-faded': 'radial-gradient(1200px 600px at 50% -10%, rgba(124,58,237,0.25), rgba(2,6,23,0))',
        'radial-cyan': 'radial-gradient(800px 400px at 50% 0%, rgba(34,211,238,0.25), rgba(2,6,23,0))',
        'grid-slate': 'linear-gradient(to right, rgba(148,163,184,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.1) 1px, transparent 1px)',
        'glass': 'linear-gradient(to bottom right, rgba(148,163,184,0.08), rgba(2,6,23,0.35))',
        'pm-gradient': 'linear-gradient(to right, #2FE3FF, #00FFC2)',
      },
      backgroundSize: {
        'grid-16': '16px 16px',
        '300%': '300% 100%',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.9)', opacity: '0.5' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        tilt: {
          '0%, 100%': { transform: 'rotate3d(1, 1, 0, 0deg)' },
          '50%': { transform: 'rotate3d(1, 1, 0, 1.25deg)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 10px rgba(167,139,250,0.35))' },
          '50%': { opacity: '0.85', filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.35))' },
        },
        numberUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s linear infinite',
        float: 'float 6s ease-in-out infinite',
        ripple: 'ripple 1s ease-out',
        tilt: 'tilt 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'number-up': 'numberUp 350ms ease-out both',
      },
      blur: {
        2: '2px',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
