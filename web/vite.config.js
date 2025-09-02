import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { purgeCss } from 'vite-plugin-tailwind-purgecss';

export default defineConfig({
	plugins: [
		sveltekit(),
		purgeCss({
			safelist: {
				// Preserve Flowbite classes that might be dynamically added
				greedy: [
					/^flowbite/,
					/^data-/,
					/^aria-/,
					/^role-/
				]
			}
		})
	],
	server: {
		host: '0.0.0.0',
		port: 5173,
		proxy: {
			'/api': {
				target: process.env.VITE_API_URL || 'http://localhost:3001',
				changeOrigin: true,
				secure: false
			}
		}
	},
	build: {
		target: 'es2020',
		minify: 'esbuild',
		rollupOptions: {
			output: {
				manualChunks: {
					flowbite: ['flowbite-svelte', 'flowbite-svelte-icons']
				}
			}
		}
	},
	optimizeDeps: {
		include: ['flowbite', 'flowbite-svelte', 'flowbite-svelte-icons']
	}
});