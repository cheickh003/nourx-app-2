<script>
	import { Card, Badge } from 'flowbite-svelte';
</script>

<svelte:head>
	<title>Admin Dashboard - NOURX</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-900 dark:text-slate-50">Admin Dashboard</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Manage clients, projects, and system overview</p>
		</div>
		<Badge color="green" class="text-sm">Phase 0 - Foundation Complete</Badge>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<Card class="p-6">
			<div class="flex items-center">
				<div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-slate-600 dark:text-slate-400">Organizations</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">--</p>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex items-center">
				<div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
					<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-slate-600 dark:text-slate-400">Active Projects</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">--</p>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex items-center">
				<div class="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
					<svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-slate-600 dark:text-slate-400">Open Tickets</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">--</p>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex items-center">
				<div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
					<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-slate-600 dark:text-slate-400">Pending Invoices</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">--</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Coming Soon Notice -->
	<Card class="p-8 text-center">
		<div class="max-w-md mx-auto">
			<div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Phase 0 Complete!</h3>
			<p class="text-slate-600 dark:text-slate-400 mb-4">
				The foundation infrastructure is ready. Dashboard functionality will be implemented in the upcoming phases.
			</p>
			<Badge color="blue">Next: Phase 2 - Authentication & User Management</Badge>
		</div>
	</Card>
</div>
