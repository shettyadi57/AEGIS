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
        bg: '#0B0F19',
        card: '#121826',
        'card-hover': '#1a2235',
        accent: '#4F9CF9',
        'accent-dark': '#2563EB',
        success: '#22C55E',
        warning: '#FACC15',
        danger: '#EF4444',
        muted: '#64748B',
        border: 'rgba(255,255,255,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(135deg, #121826, #0f1620)',
        'gradient-accent': 'linear-gradient(135deg, #4F9CF9, #2563EB)',
        'gradient-danger': 'linear-gradient(135deg, #EF4444, #DC2626)',
        'gradient-success': 'linear-gradient(135deg, #22C55E, #16A34A)',
      },
      animation: {
        'pulse-slow': 'pulse 3s infinite',
        'slide-up': 'slideUp 0.4s ease',
        'fade-in': 'fadeIn 0.3s ease',
      },
      keyframes: {
        slideUp: {
          from: { transform: 'translateY(20px)', opacity: 0 },
          to: { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}
