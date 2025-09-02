<script>
	import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Button, Search, Pagination } from 'flowbite-svelte';
	
	let projects = [
		{ 
			id: 1, 
			name: 'Website Redesign', 
			client: 'Acme Corp', 
			status: 'In Progress', 
			progress: 65,
			startDate: '2024-06-01',
			deadline: '2024-09-30',
			budget: 15000
		},
		{ 
			id: 2, 
			name: 'Mobile App Development', 
			client: 'TechStart Inc', 
			status: 'Planning', 
			progress: 25,
			startDate: '2024-07-15',
			deadline: '2024-12-15',
			budget: 45000
		},
		{ 
			id: 3, 
			name: 'API Integration', 
			client: 'Global Solutions', 
			status: 'Completed', 
			progress: 100,
			startDate: '2024-05-01',
			deadline: '2024-07-31',
			budget: 8500
		}
	];
	
	let searchTerm = '';
	let currentPage = 1;
	let itemsPerPage = 10;
	
	/** @param {string} status */
	function getStatusColor(status) {
		switch (status) {
			case 'Completed': return 'green';
			case 'In Progress': return 'blue';
			case 'Planning': return 'yellow';
			case 'On Hold': return 'red';
			default: return 'dark';
		}
	}
</script>

<svelte:head>
	<title>Projects - NOURX Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Projects</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Manage client projects and deliverables</p>
		</div>
		<Button color="primary" size="sm">
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
			</svg>
			New Project
		</Button>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Projects</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{projects.length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
					<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{projects.filter(p => p.status === 'Completed').length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
					<svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">In Progress</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{projects.filter(p => p.status === 'In Progress').length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
					<svg class="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Budget</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">${projects.reduce((sum, p) => sum + p.budget, 0).toLocaleString()}</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Filters -->
	<Card class="p-4">
		<div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
			<Search bind:value={searchTerm} placeholder="Search projects..." class="w-full sm:w-64" />
		</div>
	</Card>

	<!-- Projects Table -->
	<Card>
		<div class="p-6 pb-2">
			<h2 class="text-lg font-semibold">Projects Overview</h2>
		</div>
		
		<Table hoverable>
			<TableHead>
				<TableHeadCell>Project</TableHeadCell>
				<TableHeadCell>Client</TableHeadCell>
				<TableHeadCell>Status</TableHeadCell>
				<TableHeadCell>Progress</TableHeadCell>
				<TableHeadCell>Deadline</TableHeadCell>
				<TableHeadCell>Budget</TableHeadCell>
				<TableHeadCell>Actions</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each projects as project}
					<TableBodyRow>
						<TableBodyCell>
							<div class="font-medium text-slate-900 dark:text-slate-50">{project.name}</div>
							<div class="text-sm text-slate-500">ID: {project.id}</div>
						</TableBodyCell>
						<TableBodyCell class="text-slate-600 dark:text-slate-400">{project.client}</TableBodyCell>
						<TableBodyCell>
							<Badge color={getStatusColor(project.status)}>{project.status}</Badge>
						</TableBodyCell>
						<TableBodyCell>
							<div class="flex items-center gap-2">
								<div class="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
									<div class="bg-blue-600 h-2 rounded-full" style="width: {project.progress}%"></div>
								</div>
								<span class="text-sm text-slate-600 dark:text-slate-400">{project.progress}%</span>
							</div>
						</TableBodyCell>
						<TableBodyCell class="text-slate-600 dark:text-slate-400">{project.deadline}</TableBodyCell>
						<TableBodyCell class="text-slate-600 dark:text-slate-400">${project.budget.toLocaleString()}</TableBodyCell>
						<TableBodyCell>
							<div class="flex gap-2">
								<Button color="alternative" size="xs">View</Button>
								<Button color="alternative" size="xs">Edit</Button>
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</Card>
</div>
