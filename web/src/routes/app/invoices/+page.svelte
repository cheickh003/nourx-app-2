<script>
	import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Button, Modal, Tabs, TabItem } from 'flowbite-svelte';
	
	let invoices = [
		{
			id: 'INV-2024-001',
			amount: 15000,
			status: 'Paid',
			dueDate: '2024-08-15',
			paidDate: '2024-08-10',
			issueDate: '2024-07-15',
			description: 'Website Redesign - Phase 1',
			items: [
				{ description: 'UI/UX Design', quantity: 40, rate: 125, amount: 5000 },
				{ description: 'Frontend Development', quantity: 60, rate: 100, amount: 6000 },
				{ description: 'Backend Development', quantity: 40, rate: 100, amount: 4000 }
			]
		},
		{
			id: 'INV-2024-002',
			amount: 22500,
			status: 'Pending',
			dueDate: '2024-09-30',
			paidDate: null,
			issueDate: '2024-08-01',
			description: 'Website Redesign - Phase 2',
			items: [
				{ description: 'Content Management System', quantity: 80, rate: 125, amount: 10000 },
				{ description: 'E-commerce Integration', quantity: 60, rate: 150, amount: 9000 },
				{ description: 'Testing & QA', quantity: 35, rate: 100, amount: 3500 }
			]
		},
		{
			id: 'INV-2024-003',
			amount: 8500,
			status: 'Overdue',
			dueDate: '2024-08-20',
			paidDate: null,
			issueDate: '2024-07-20',
			description: 'Additional Revisions',
			items: [
				{ description: 'Design Revisions', quantity: 25, rate: 125, amount: 3125 },
				{ description: 'Content Updates', quantity: 30, rate: 75, amount: 2250 },
				{ description: 'Performance Optimization', quantity: 30, rate: 100, amount: 3000 },
				{ description: 'Documentation', quantity: 8, rate: 75, amount: 600 }
			]
		}
	];
	
/** @type {any} */
let selectedInvoice = null;
	let showInvoiceModal = false;
	
/** @param {any} invoice */
function viewInvoice(invoice) {
		selectedInvoice = invoice;
		showInvoiceModal = true;
	}
	
/** @param {any} invoice */
function downloadInvoice(invoice) {
		// TODO: Implement PDF download
		alert(`Downloading ${invoice.id}.pdf`);
	}
	
/** @param {any} invoice */
function payInvoice(invoice) {
		// TODO: Implement payment flow
		alert(`Redirecting to payment for ${invoice.id}`);
	}
	
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
	
	$: totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
	$: paidAmount = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
	$: pendingAmount = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
	$: overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);
</script>

<svelte:head>
	<title>Invoices - NOURX Client Portal</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Invoices</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">View and manage your invoices and payments</p>
		</div>
		<Button color="primary" size="sm">
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			Download All
		</Button>
	</div>

	<!-- Invoice Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Amount</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">${totalAmount.toLocaleString()}</p>
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
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Paid</p>
					<p class="text-2xl font-bold text-green-600 dark:text-green-400">${paidAmount.toLocaleString()}</p>
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
	</div>

	<!-- Invoices Table -->
	<Card>
		<div class="p-6 pb-2">
			<h2 class="text-lg font-semibold">Invoice History</h2>
		</div>
		
		<Table hoverable>
			<TableHead>
				<TableHeadCell>Invoice</TableHeadCell>
				<TableHeadCell>Description</TableHeadCell>
				<TableHeadCell>Amount</TableHeadCell>
				<TableHeadCell>Status</TableHeadCell>
				<TableHeadCell>Due Date</TableHeadCell>
				<TableHeadCell>Actions</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each invoices as invoice}
					<TableBodyRow>
						<TableBodyCell>
							<div class="font-medium text-slate-900 dark:text-slate-50">{invoice.id}</div>
							<div class="text-sm text-slate-500">Issued: {invoice.issueDate}</div>
						</TableBodyCell>
						<TableBodyCell class="max-w-xs">
							<div class="text-slate-900 dark:text-slate-50">{invoice.description}</div>
							{#if invoice.paidDate}
								<div class="text-sm text-slate-500">Paid: {invoice.paidDate}</div>
							{/if}
						</TableBodyCell>
						<TableBodyCell class="font-semibold text-slate-900 dark:text-slate-50">
							${invoice.amount.toLocaleString()}
						</TableBodyCell>
						<TableBodyCell>
							<Badge color={getStatusColor(invoice.status)}>{invoice.status}</Badge>
						</TableBodyCell>
						<TableBodyCell class="text-slate-600 dark:text-slate-400">
							{invoice.dueDate}
						</TableBodyCell>
						<TableBodyCell>
							<div class="flex gap-2">
								<Button color="alternative" size="xs" on:click={() => viewInvoice(invoice)}>View</Button>
								<Button color="alternative" size="xs" on:click={() => downloadInvoice(invoice)}>Download</Button>
								{#if invoice.status === 'Pending' || invoice.status === 'Overdue'}
									<Button color="primary" size="xs" on:click={() => payInvoice(invoice)}>Pay Now</Button>
								{/if}
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</Card>
</div>

<!-- Invoice Details Modal -->
<Modal bind:open={showInvoiceModal} size="xl" class="w-full">
	{#if selectedInvoice}
		<div class="space-y-6">
			<!-- Invoice Header -->
			<div class="flex justify-between items-start">
				<div>
					<h2 class="text-2xl font-bold text-slate-900 dark:text-slate-50">NOURX</h2>
					<p class="text-slate-600 dark:text-slate-400">Professional Services</p>
				</div>
				<div class="text-right">
					<h3 class="text-lg font-semibold text-slate-900 dark:text-slate-50">{selectedInvoice.id}</h3>
					<Badge color={getStatusColor(selectedInvoice.status)} large>{selectedInvoice.status}</Badge>
				</div>
			</div>

			<!-- Invoice Details -->
			<div class="grid grid-cols-2 gap-6">
				<div>
					<h4 class="font-medium text-slate-900 dark:text-slate-50 mb-2">Bill To:</h4>
					<p class="text-slate-600 dark:text-slate-400">
						NOURX Demo Client<br>
						123 Business St.<br>
						City, State 12345
					</p>
				</div>
				<div>
					<div class="space-y-2">
						<div class="flex justify-between">
							<span class="text-slate-600 dark:text-slate-400">Issue Date:</span>
							<span class="text-slate-900 dark:text-slate-50">{selectedInvoice.issueDate}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-slate-600 dark:text-slate-400">Due Date:</span>
							<span class="text-slate-900 dark:text-slate-50">{selectedInvoice.dueDate}</span>
						</div>
						{#if selectedInvoice.paidDate}
							<div class="flex justify-between">
								<span class="text-slate-600 dark:text-slate-400">Paid Date:</span>
								<span class="text-green-600 dark:text-green-400">{selectedInvoice.paidDate}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Invoice Items -->
			<div>
				<h4 class="font-medium text-slate-900 dark:text-slate-50 mb-4">Invoice Items</h4>
				<Table>
					<TableHead>
						<TableHeadCell>Description</TableHeadCell>
						<TableHeadCell>Qty/Hours</TableHeadCell>
						<TableHeadCell>Rate</TableHeadCell>
						<TableHeadCell>Amount</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each selectedInvoice.items as item}
							<TableBodyRow>
								<TableBodyCell class="text-slate-900 dark:text-slate-50">{item.description}</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">{item.quantity}</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">${item.rate}</TableBodyCell>
								<TableBodyCell class="font-medium text-slate-900 dark:text-slate-50">${item.amount.toLocaleString()}</TableBodyCell>
							</TableBodyRow>
						{/each}
						<TableBodyRow>
							<TableBodyCell colspan="3" class="font-medium text-right text-slate-900 dark:text-slate-50">Total:</TableBodyCell>
							<TableBodyCell class="font-bold text-lg text-slate-900 dark:text-slate-50">${selectedInvoice.amount.toLocaleString()}</TableBodyCell>
						</TableBodyRow>
					</TableBody>
				</Table>
			</div>

			<!-- Actions -->
			<div class="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
				<Button color="alternative" on:click={() => downloadInvoice(selectedInvoice)}>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					Download PDF
				</Button>
				{#if selectedInvoice.status === 'Pending' || selectedInvoice.status === 'Overdue'}
					<Button color="primary" on:click={() => payInvoice(selectedInvoice)}>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						Pay Now
					</Button>
				{/if}
				<Button color="alternative">Print</Button>
			</div>
		</div>
	{/if}
</Modal>
