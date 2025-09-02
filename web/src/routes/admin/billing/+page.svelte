<script>
	import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Button, Search, Pagination, Tabs, TabItem } from 'flowbite-svelte';
	
	let invoices = [
		{ 
			id: 'INV-2024-001', 
			client: 'Acme Corp',
			amount: 15000,
			status: 'Paid',
			dueDate: '2024-08-15',
			paidDate: '2024-08-10',
			created: '2024-07-15'
		},
		{ 
			id: 'INV-2024-002', 
			client: 'TechStart Inc',
			amount: 22500,
			status: 'Pending',
			dueDate: '2024-09-30',
			paidDate: null,
			created: '2024-08-01'
		},
		{ 
			id: 'INV-2024-003', 
			client: 'Global Solutions',
			amount: 8500,
			status: 'Overdue',
			dueDate: '2024-08-20',
			paidDate: null,
			created: '2024-07-20'
		}
	];
	
	let payments = [
		{
			id: 'PAY-001',
			invoice: 'INV-2024-001',
			client: 'Acme Corp',
			amount: 15000,
			method: 'Bank Transfer',
			date: '2024-08-10',
			status: 'Completed'
		},
		{
			id: 'PAY-002',
			invoice: 'INV-2024-004',
			client: 'StartupXYZ',
			amount: 5000,
			method: 'Credit Card',
			date: '2024-08-22',
			status: 'Completed'
		}
	];
	
	let searchTerm = '';
	
	/** @param {string} status */
	function getStatusColor(status) {
		switch (status) {
			case 'Paid': return 'green';
			case 'Pending': return 'yellow';
			case 'Overdue': return 'red';
			case 'Draft': return 'dark';
			default: return 'dark';
		}
	}
	
	$: totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
	$: pendingAmount = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
	$: overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);
</script>

<svelte:head>
	<title>Invoicing & Billing - NOURX Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Invoicing & Billing</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Manage invoices, payments and financial tracking</p>
		</div>
		<Button color="primary" size="sm">
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
			</svg>
			New Invoice
		</Button>
	</div>

	<!-- Financial Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
					<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Revenue</p>
					<p class="text-2xl font-bold text-green-600 dark:text-green-400">${totalRevenue.toLocaleString()}</p>
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
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Pending</p>
					<p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${pendingAmount.toLocaleString()}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
					<svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Overdue</p>
					<p class="text-2xl font-bold text-red-600 dark:text-red-400">${overdueAmount.toLocaleString()}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
					<svg class="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Invoices</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{invoices.length}</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Filters -->
	<Card class="p-4">
		<div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
			<Search bind:value={searchTerm} placeholder="Search invoices..." class="w-full sm:w-64" />
		</div>
	</Card>

	<!-- Invoices & Payments Tabs -->
	<Tabs>
		<TabItem open title="Invoices">
			<Card>
				<div class="p-6 pb-2">
					<h2 class="text-lg font-semibold">Invoice Management</h2>
				</div>
				
				<Table hoverable>
					<TableHead>
						<TableHeadCell>Invoice</TableHeadCell>
						<TableHeadCell>Client</TableHeadCell>
						<TableHeadCell>Amount</TableHeadCell>
						<TableHeadCell>Status</TableHeadCell>
						<TableHeadCell>Due Date</TableHeadCell>
						<TableHeadCell>Paid Date</TableHeadCell>
						<TableHeadCell>Actions</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each invoices as invoice}
							<TableBodyRow>
								<TableBodyCell>
									<div class="font-medium text-slate-900 dark:text-slate-50">{invoice.id}</div>
									<div class="text-sm text-slate-500">Created: {invoice.created}</div>
								</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">{invoice.client}</TableBodyCell>
								<TableBodyCell class="font-semibold text-slate-900 dark:text-slate-50">${invoice.amount.toLocaleString()}</TableBodyCell>
								<TableBodyCell>
									<Badge color={getStatusColor(invoice.status)}>{invoice.status}</Badge>
								</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">{invoice.dueDate}</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">
									{invoice.paidDate || '-'}
								</TableBodyCell>
								<TableBodyCell>
									<div class="flex gap-2">
										<Button color="alternative" size="xs">View</Button>
										<Button color="alternative" size="xs">Edit</Button>
										<Button color="alternative" size="xs">Send</Button>
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			</Card>
		</TabItem>

		<TabItem title="Payments">
			<Card>
				<div class="p-6 pb-2">
					<h2 class="text-lg font-semibold">Payment History</h2>
				</div>
				
				<Table hoverable>
					<TableHead>
						<TableHeadCell>Payment</TableHeadCell>
						<TableHeadCell>Invoice</TableHeadCell>
						<TableHeadCell>Client</TableHeadCell>
						<TableHeadCell>Amount</TableHeadCell>
						<TableHeadCell>Method</TableHeadCell>
						<TableHeadCell>Date</TableHeadCell>
						<TableHeadCell>Status</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each payments as payment}
							<TableBodyRow>
								<TableBodyCell>
									<div class="font-medium text-slate-900 dark:text-slate-50">{payment.id}</div>
								</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">{payment.invoice}</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">{payment.client}</TableBodyCell>
								<TableBodyCell class="font-semibold text-slate-900 dark:text-slate-50">${payment.amount.toLocaleString()}</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">{payment.method}</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">{payment.date}</TableBodyCell>
								<TableBodyCell>
									<Badge color="green">{payment.status}</Badge>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			</Card>
		</TabItem>
	</Tabs>
</div>
