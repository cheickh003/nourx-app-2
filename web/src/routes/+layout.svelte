<script>
	import '../app.css';
	import { onMount } from 'svelte';

	// Global toast container
	import ToastContainer from '$lib/components/ToastContainer.svelte';

	// Initialize theme from localStorage or system preference
	onMount(() => {
		const theme = localStorage.getItem('theme') || 
		             (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
		
		document.documentElement.classList.toggle('dark', theme === 'dark');
	});
</script>

<main>
	<slot />
</main>

<!-- Global toasts -->
<ToastContainer />

<style>
	:global(html) {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	:global(body) {
		margin: 0;
		padding: 0;
		min-height: 100vh;
		background-color: rgb(var(--background));
		color: rgb(var(--foreground));
	}
</style>
