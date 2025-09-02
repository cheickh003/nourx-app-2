import flowbite from 'flowbite/plugin';

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite/**/*.js'
	],
	
	darkMode: 'class',
	
	theme: {
		extend: {
			colors: {
				// Design tokens mapped to CSS variables (allows classes like bg-background, text-foreground, ring-ring, border-border)
				background: 'rgb(var(--background) / <alpha-value>)',
				foreground: 'rgb(var(--foreground) / <alpha-value>)',
				card: 'rgb(var(--card) / <alpha-value>)',
				'card-foreground': 'rgb(var(--card-foreground) / <alpha-value>)',
				popover: 'rgb(var(--popover) / <alpha-value>)',
				'popover-foreground': 'rgb(var(--popover-foreground) / <alpha-value>)',
				primary: 'rgb(var(--primary) / <alpha-value>)',
				'primary-foreground': 'rgb(var(--primary-foreground) / <alpha-value>)',
				secondary: 'rgb(var(--secondary) / <alpha-value>)',
				'secondary-foreground': 'rgb(var(--secondary-foreground) / <alpha-value>)',
				muted: 'rgb(var(--muted) / <alpha-value>)',
				'muted-foreground': 'rgb(var(--muted-foreground) / <alpha-value>)',
				accent: 'rgb(var(--accent) / <alpha-value>)',
				'accent-foreground': 'rgb(var(--accent-foreground) / <alpha-value>)',
				destructive: 'rgb(var(--destructive) / <alpha-value>)',
				'destructive-foreground': 'rgb(var(--destructive-foreground) / <alpha-value>)',
				border: 'rgb(var(--border) / <alpha-value>)',
				input: 'rgb(var(--input) / <alpha-value>)',
				ring: 'rgb(var(--ring) / <alpha-value>)'
			},
			fontFamily: {
				sans: [
					'Inter',
					'-apple-system',
					'BlinkMacSystemFont',
					'Segoe UI',
					'Roboto',
					'Oxygen',
					'Ubuntu',
					'Cantarell',
					'Fira Sans',
					'Droid Sans',
					'Helvetica Neue',
					'sans-serif'
				]
			},
			
			borderRadius: {
				DEFAULT: '6px'
			},
			
			spacing: {
				'18': '4.5rem',
				'88': '22rem'
			},
			
			animation: {
				'fade-in': 'fadeIn 0.2s ease-in-out',
				'slide-in': 'slideIn 0.3s ease-out',
				'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
			},
			
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideIn: {
					'0%': { transform: 'translateX(-100%)' },
					'100%': { transform: 'translateX(0)' }
				}
			}
		}
	},
	
	plugins: [
		flowbite,
		require('@tailwindcss/forms'),
		require('@tailwindcss/typography')
	]
};
