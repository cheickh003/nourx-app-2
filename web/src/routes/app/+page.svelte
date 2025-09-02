<script>
	import { Card, Badge } from 'flowbite-svelte';
</script>

<svelte:head>
	<title>Dashboard - NOURX Client Portal</title>
</svelte:head>

<div class="space-y-6">
	<!-- Page Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Welcome to your NOURX client portal</p>
		</div>
		<Badge color="green" class="text-sm">Phase 0 - Foundation Complete</Badge>
	</div>

	<!-- Quick Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-6">
		<Card class="p-6">
			<div class="flex items-center">
				<div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
				<div class="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
					<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-slate-600 dark:text-slate-400">Paid Invoices</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">--</p>
				</div>
			</div>
		</Card>

		<Card class="p-6">
			<div class="flex items-center">
				<div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
					<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm text-slate-600 dark:text-slate-400">Documents</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">--</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Recent Activity Placeholder -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<Card class="p-6">
			<h2 class="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Recent Projects</h2>
			<div class="text-center py-8">
				<svg class="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
				<p class="text-slate-500 dark:text-slate-400">Project data will be available in Phase 3</p>
			</div>
		</Card>

		<Card class="p-6">
			<h2 class="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Recent Support Tickets</h2>
			<div class="text-center py-8">
				<svg class="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
				<p class="text-slate-500 dark:text-slate-400">Support system will be available in Phase 2</p>
			</div>
		</Card>
	</div>

	<!-- Coming Soon Notice -->
	<Card class="p-8 text-center">
		<div class="max-w-md mx-auto">
			<div class="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
				<svg class="w-8 h-8 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
				</svg>
			</div>
			<h3 class="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">Foundation Ready!</h3>
			<p class="text-slate-600 dark:text-slate-400 mb-4">
				Your client portal foundation is complete. Full functionality will be available as features are implemented in the upcoming phases.
			</p>
		<Badge color="blue">Next: Phase 2 - Authentication & Account Management</Badge>
		</div>
	</Card>
</div>
