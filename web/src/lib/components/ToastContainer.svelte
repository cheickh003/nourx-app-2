<script>
	import { toastStore } from '$lib/stores/toast';
	import ToastNotification from './ToastNotification.svelte';
	
	/** @param {number} id */
	function removeToast(id) {
		toastStore.remove(id);
	}
</script>

<div class="fixed top-4 right-4 z-50 space-y-2 w-96 max-w-[calc(100vw-2rem)]" aria-live="polite" aria-label="Notifications">
	{#each $toastStore as toast (toast.id)}
		<ToastNotification
			type={toast.type}
			title={toast.title}
			message={toast.message}
			timeout={toast.timeout}
			dismissible={toast.dismissible}
			on:dismiss={() => removeToast(toast.id)}
		/>
	{/each}
</div>
