/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#050508',
        surface: '#0a0a12',
        panel: '#0f0f1a',
        border: '#1a1a2e',
        'border-bright': '#252540',
        accent: '#00d4ff',
        'accent-dim': '#0099bb',
        'accent-glow': 'rgba(0, 212, 255, 0.15)',
        gold: '#ffd700',
        'gold-dim': '#cc9900',
        danger: '#ff3366',
        success: '#00ff88',
        muted: '#4a4a6a',
        text: '#e0e0f0',
        'text-dim': '#8888aa',
      },
      fontFamily: {
        display: ['"Orbitron"', 'monospace'],
        body: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-gold': '0 0 20px rgba(255, 215, 0, 0.3)',
        'glow-danger': '0 0 20px rgba(255, 51, 102, 0.3)',
        'panel': '0 4px 32px rgba(0,0,0,0.8)',
        'inner-glow': 'inset 0 0 20px rgba(0, 212, 255, 0.05)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scan': 'scan 4s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'typewriter': 'typewriter 2s steps(20) forwards',
      },
      keyframes: {
        scan: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100vh' },
        },
        flicker: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
