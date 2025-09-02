<script>
	import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Button, Search, Pagination, Tabs, TabItem, Select } from 'flowbite-svelte';
	
	let tickets = [
		{ 
			id: 'TKT-001', 
			subject: 'Login issues with new account',
			client: 'Acme Corp',
			user: 'john@acme.com',
			priority: 'High', 
			status: 'Open',
			created: '2024-08-25 10:30',
			updated: '2024-08-25 14:20',
			assignee: 'support@nourx.com'
		},
		{ 
			id: 'TKT-002', 
			subject: 'Feature request: Export data to CSV',
			client: 'TechStart Inc',
			user: 'sarah@techstart.com',
			priority: 'Medium', 
			status: 'In Progress',
			created: '2024-08-24 16:45',
			updated: '2024-08-25 09:15',
			assignee: 'admin@nourx.com'
		},
		{ 
			id: 'TKT-003', 
			subject: 'Invoice payment not reflecting',
			client: 'Global Solutions',
			user: 'mike@global.com',
			priority: 'High', 
			status: 'Resolved',
			created: '2024-08-23 11:20',
			updated: '2024-08-24 15:30',
			assignee: 'support@nourx.com'
		}
	];
	
	let searchTerm = '';
	let statusFilter = 'all';
	let priorityFilter = 'all';
	
	/** @param {string} status */
	function getStatusColor(status) {
		switch (status) {
			case 'Open': return 'red';
			case 'In Progress': return 'yellow';
			case 'Resolved': return 'green';
			case 'Closed': return 'dark';
			default: return 'dark';
		}
	}
	
	/** @param {string} priority */
	function getPriorityColor(priority) {
		switch (priority) {
			case 'High': return 'red';
			case 'Medium': return 'yellow';
			case 'Low': return 'green';
			default: return 'dark';
		}
	}
	
	$: filteredTickets = tickets.filter(ticket => {
		const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ticket.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
			ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
		const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
		return matchesSearch && matchesStatus && matchesPriority;
	});
</script>

<svelte:head>
	<title>Support Tickets - NOURX Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Support Tickets</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Manage customer support tickets and requests</p>
		</div>
		<Button color="primary" size="sm">
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
			</svg>
			New Ticket
		</Button>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
					<svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Open Tickets</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{tickets.filter(t => t.status === 'Open').length}</p>
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
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{tickets.filter(t => t.status === 'In Progress').length}</p>
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
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Resolved</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{tickets.filter(t => t.status === 'Resolved').length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
					<svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">High Priority</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{tickets.filter(t => t.priority === 'High').length}</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Filters -->
	<Card class="p-4">
		<div class="flex flex-col sm:flex-row gap-4 items-center">
			<Search bind:value={searchTerm} placeholder="Search tickets..." class="w-full sm:w-64" />
			<Select bind:value={statusFilter} class="w-full sm:w-40">
				<option value="all">All Status</option>
				<option value="Open">Open</option>
				<option value="In Progress">In Progress</option>
				<option value="Resolved">Resolved</option>
				<option value="Closed">Closed</option>
			</Select>
			<Select bind:value={priorityFilter} class="w-full sm:w-40">
				<option value="all">All Priority</option>
				<option value="High">High</option>
				<option value="Medium">Medium</option>
				<option value="Low">Low</option>
			</Select>
		</div>
	</Card>

	<!-- Tickets Table -->
	<Card>
		<div class="p-6 pb-2">
			<h2 class="text-lg font-semibold">Support Queue</h2>
		</div>
		
		<Table hoverable>
			<TableHead>
				<TableHeadCell>Ticket</TableHeadCell>
				<TableHeadCell>Client</TableHeadCell>
				<TableHeadCell>Priority</TableHeadCell>
				<TableHeadCell>Status</TableHeadCell>
				<TableHeadCell>Assignee</TableHeadCell>
				<TableHeadCell>Updated</TableHeadCell>
				<TableHeadCell>Actions</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each filteredTickets as ticket}
					<TableBodyRow>
						<TableBodyCell>
							<div class="font-medium text-slate-900 dark:text-slate-50">{ticket.subject}</div>
							<div class="text-sm text-slate-500">
								{ticket.id} • {ticket.user}
							</div>
						</TableBodyCell>
						<TableBodyCell class="text-slate-600 dark:text-slate-400">{ticket.client}</TableBodyCell>
						<TableBodyCell>
							<Badge color={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
						</TableBodyCell>
						<TableBodyCell>
							<Badge color={getStatusColor(ticket.status)}>{ticket.status}</Badge>
						</TableBodyCell>
						<TableBodyCell class="text-slate-600 dark:text-slate-400">{ticket.assignee}</TableBodyCell>
						<TableBodyCell class="text-slate-600 dark:text-slate-400">{ticket.updated}</TableBodyCell>
						<TableBodyCell>
							<div class="flex gap-2">
								<Button color="alternative" size="xs">View</Button>
								<Button color="alternative" size="xs">Reply</Button>
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</Card>
</div>
