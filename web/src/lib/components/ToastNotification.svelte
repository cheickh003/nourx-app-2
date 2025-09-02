<script>
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	
	const dispatch = createEventDispatcher();
	
	/** @type {'success' | 'error' | 'warning' | 'info'} */
	export let type = 'info'; // success, error, warning, info
	export let title = '';
	export let message = '';
	export let timeout = 5000;
	export let dismissible = true;
	
	let visible = true;
	
	// Fermeture automatique après timeout
	if (timeout > 0) {
		setTimeout(() => {
			dismiss();
		}, timeout);
	}
	
	function dismiss() {
		visible = false;
		setTimeout(() => {
			dispatch('dismiss');
		}, 300); // Attendre que la transition se termine
	}
	
	/** @type {Record<string, string>} */
	const iconColors = {
		success: 'text-green-500',
		error: 'text-red-500',
		warning: 'text-yellow-500',
		info: 'text-blue-500'
	};
	$: iconColor = iconColors[type];
	
	/** @type {Record<string, string>} */
	const bgColors = {
		success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
		error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
		warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
		info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
	};
	$: bgColor = bgColors[type];
	
	/** @type {Record<string, string>} */
	const icons = {
		success: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
		error: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />`,
		warning: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />`,
		info: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`
	};
</script>

{#if visible}
	<div 
		class="flex items-start gap-3 p-4 border rounded-lg shadow-sm {bgColor}"
		transition:fly="{{ y: -50, duration: 300 }}"
	>
		<div class="flex-shrink-0">
			<svg class="w-5 h-5 {iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
				{@html icons[type]}
			</svg>
		</div>
		
		<div class="flex-1 min-w-0">
			{#if title}
				<p class="text-sm font-medium text-slate-900 dark:text-slate-50">{title}</p>
			{/if}
			{#if message}
				<p class="text-sm text-slate-600 dark:text-slate-400 {title ? 'mt-1' : ''}">{message}</p>
			{/if}
		</div>
		
		{#if dismissible}
			<button
				type="button"
				class="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
				on:click={dismiss} aria-label="Fermer la notification"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>
{/if}
