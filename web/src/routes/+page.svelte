<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Card } from 'flowbite-svelte';
	import { Button } from 'flowbite-svelte';

	onMount(() => {
		// Check if user is already authenticated and redirect accordingly
		const token = localStorage.getItem('accessToken');
		const userType = localStorage.getItem('userType');
		
		if (token && userType) {
			if (userType === 'admin') {
				goto('/admin');
			} else {
				goto('/app');
			}
		}
	});

	function goToClientLogin() {
		goto('/login');
	}

	function goToAdminLogin() {
		goto('/admin/login');
	}
</script>

<svelte:head>
	<title>NOURX - Client Portal & Project Management</title>
	<meta name="description" content="Access your projects, invoices, and support tickets through the NOURX platform" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
	<div class="container mx-auto px-4 py-16">
		<div class="max-w-4xl mx-auto text-center">
			<!-- Logo/Brand -->
			<div class="mb-12">
				<h1 class="text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
					NOURX
				</h1>
				<p class="text-xl text-slate-600 dark:text-slate-400">
					Client Portal & Project Management Platform
				</p>
			</div>

			<!-- Login Options -->
			<div class="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
				<!-- Client Login -->
				<Card class="p-8 hover:shadow-lg transition-shadow">
					<div class="text-center">
						<div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</div>
						<h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-3">
							Client Access
						</h2>
						<p class="text-slate-600 dark:text-slate-400 mb-6">
							Access your projects, view invoices, and manage support tickets
						</p>
						<Button on:click={goToClientLogin} class="w-full" size="lg">
							Client Login
						</Button>
					</div>
				</Card>

				<!-- Admin Login -->
				<Card class="p-8 hover:shadow-lg transition-shadow">
					<div class="text-center">
						<div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
							<svg class="w-8 h-8 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</div>
						<h2 class="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-3">
							Admin Access
						</h2>
						<p class="text-slate-600 dark:text-slate-400 mb-6">
							Manage clients, projects, invoices, and system settings
						</p>
						<Button on:click={goToAdminLogin} class="w-full" color="alternative" size="lg">
							Admin Login
						</Button>
					</div>
				</Card>
			</div>

			<!-- Features -->
			<div class="mt-16 grid md:grid-cols-3 gap-8">
				<div class="text-center">
					<div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-slate-50 mb-2">Project Management</h3>
					<p class="text-sm text-slate-600 dark:text-slate-400">Track project progress and deliverables</p>
				</div>

				<div class="text-center">
					<div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-slate-50 mb-2">Invoicing</h3>
					<p class="text-sm text-slate-600 dark:text-slate-400">View and manage invoices and payments</p>
				</div>

				<div class="text-center">
					<div class="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto mb-4">
						<svg class="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
						</svg>
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-slate-50 mb-2">Support</h3>
					<p class="text-sm text-slate-600 dark:text-slate-400">Get help through our ticket system</p>
				</div>
			</div>
		</div>
	</div>
</div>