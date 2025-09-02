<script>
	export let size = 'medium'; // small, medium, large
	export let color = 'primary'; // primary, secondary, white
	
	$: sizeClass = {
		small: 'w-4 h-4',
		medium: 'w-8 h-8',
		large: 'w-12 h-12'
	}[size];
	
	$: colorClass = {
		primary: 'text-primary',
		secondary: 'text-secondary',
		white: 'text-white'
	}[color];
</script>

<div class="inline-flex items-center justify-center">
	<svg 
		class="animate-spin {sizeClass} {colorClass}" 
		fill="none" 
		viewBox="0 0 24 24" aria-label="Chargement..." role="img"
	>
		<circle 
			class="opacity-25" 
			cx="12" 
			cy="12" 
			r="10" 
			stroke="currentColor" 
			stroke-width="4"
		></circle>
		<path 
			class="opacity-75" 
			fill="currentColor" 
			d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
		></path>
	</svg>
</div>