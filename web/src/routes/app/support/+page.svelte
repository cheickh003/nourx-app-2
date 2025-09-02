<script>
	import { Card, Badge, Button, Input, Label, Textarea, Select, Modal, Timeline, TimelineItem, Fileupload } from 'flowbite-svelte';
	
	let tickets = [
		{
			id: 'TKT-001',
			subject: 'Login issues with new account',
			status: 'Open',
			priority: 'High',
			created: '2024-08-25 10:30',
			updated: '2024-08-25 14:20',
			messages: [
				{
					sender: 'You',
					message: 'I\'m having trouble logging into my account after the recent password reset.',
					timestamp: '2024-08-25 10:30',
					type: 'user'
				},
				{
					sender: 'NOURX Support',
					message: 'Hi! Thanks for reaching out. I can help you with the login issue. Can you please tell me what error message you\'re seeing?',
					timestamp: '2024-08-25 11:45',
					type: 'support'
				},
				{
					sender: 'You',
					message: 'The error says "Invalid credentials" even though I\'m using the new password.',
					timestamp: '2024-08-25 14:20',
					type: 'user'
				}
			]
		},
		{
			id: 'TKT-002',
			subject: 'Request for project timeline extension',
			status: 'Resolved',
			priority: 'Medium',
			created: '2024-08-20 16:15',
			updated: '2024-08-22 09:30',
			messages: [
				{
					sender: 'You',
					message: 'Due to some changes in our requirements, we need to extend the project deadline by 2 weeks.',
					timestamp: '2024-08-20 16:15',
					type: 'user'
				},
				{
					sender: 'NOURX Support',
					message: 'I understand your need for a timeline extension. Let me connect you with your project manager to discuss the details.',
					timestamp: '2024-08-21 09:00',
					type: 'support'
				},
				{
					sender: 'Project Manager',
					message: 'Hi! I\'ve reviewed your request and we can accommodate the 2-week extension. The new deadline is September 15th.',
					timestamp: '2024-08-22 09:30',
					type: 'support'
				}
			]
		}
	];
	
	let showNewTicketModal = false;
	let showTicketModal = false;
/** @type {any} */
let selectedTicket = null;
/** @type {{subject: string; priority: string; message: string; attachments?: FileList}} */
let newTicket = {
		subject: '',
		priority: 'Medium',
		message: '',
    attachments: undefined
};
	let newMessage = '';
	
/** @param {any} ticket */
function openTicket(ticket) {
		selectedTicket = ticket;
		showTicketModal = true;
	}
	
	function createNewTicket() {
		showNewTicketModal = true;
	}
	
	function submitTicket() {
		// TODO: Implement ticket submission
		console.log('New ticket:', newTicket);
		showNewTicketModal = false;
		// Reset form
    newTicket = {
			subject: '',
			priority: 'Medium',
			message: '',
        attachments: undefined
    };
	}
	
	function sendMessage() {
		if (newMessage.trim() && selectedTicket) {
			selectedTicket.messages.push({
				sender: 'You',
				message: newMessage,
				timestamp: new Date().toLocaleString(),
				type: 'user'
			});
			selectedTicket.status = 'Open';
			newMessage = '';
			// Update the tickets array
			tickets = tickets;
		}
	}
	
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
</script>

<svelte:head>
	<title>Support Center - NOURX Client Portal</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Support Center</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Get help and track your support requests</p>
		</div>
		<Button color="primary" size="sm" on:click={createNewTicket}>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
			</svg>
			New Ticket
		</Button>
	</div>

	<!-- Support Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Tickets</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{tickets.length}</p>
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
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Open Tickets</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{tickets.filter(t => t.status === 'Open').length}</p>
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
				<div class="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
					<svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Avg Response</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">2.5h</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Support Tickets -->
	<Card>
		<div class="p-6 pb-2">
			<h2 class="text-lg font-semibold">Your Support Tickets</h2>
		</div>
		
		<div class="space-y-4 p-6">
			{#each tickets as ticket}
				<div
					class="border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
					role="button"
					tabindex="0"
					on:click={() => openTicket(ticket)}
					on:keydown={(e) => (e.key === 'Enter' || e.key === ' ') && openTicket(ticket)}
				>
					<div class="flex justify-between items-start mb-2">
						<div>
							<h3 class="font-medium text-slate-900 dark:text-slate-50">{ticket.subject}</h3>
							<p class="text-sm text-slate-500">Ticket #{ticket.id}</p>
						</div>
						<div class="flex gap-2">
                        <Badge color={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                        <Badge color={getStatusColor(ticket.status)}>{ticket.status}</Badge>
						</div>
					</div>
					<div class="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
						<span>Created: {ticket.created}</span>
						<span>Last updated: {ticket.updated}</span>
					</div>
				</div>
			{/each}
			
			{#if tickets.length === 0}
				<div class="text-center py-12">
					<svg class="w-12 h-12 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<p class="text-slate-500">No support tickets yet</p>
					<Button color="primary" class="mt-4" on:click={createNewTicket}>Create Your First Ticket</Button>
				</div>
			{/if}
		</div>
	</Card>
</div>

<!-- New Ticket Modal -->
<Modal bind:open={showNewTicketModal} size="lg" class="w-full">
	<form on:submit|preventDefault={submitTicket}>
		<div class="space-y-6">
			<div>
				<h3 class="text-lg font-medium text-slate-900 dark:text-slate-50 mb-4">Create New Support Ticket</h3>
			</div>
			
			<div>
				<Label for="subject" class="mb-2">Subject *</Label>
				<Input id="subject" bind:value={newTicket.subject} placeholder="Brief description of your issue" required />
			</div>
			
			<div>
				<Label for="priority" class="mb-2">Priority</Label>
				<Select id="priority" bind:value={newTicket.priority}>
					<option value="Low">Low</option>
					<option value="Medium">Medium</option>
					<option value="High">High</option>
				</Select>
			</div>
			
			<div>
				<Label for="message" class="mb-2">Description *</Label>
				<Textarea id="message" bind:value={newTicket.message} rows="6" placeholder="Please provide detailed information about your issue..." required />
			</div>
			
			<div>
				<Label class="mb-2">Attachments</Label>
				<Fileupload bind:files={newTicket.attachments} />
			</div>
			
			<div class="flex gap-3 pt-4">
				<Button type="submit" color="primary">Submit Ticket</Button>
				<Button type="button" color="alternative" on:click={() => showNewTicketModal = false}>Cancel</Button>
			</div>
		</div>
	</form>
</Modal>

<!-- Ticket Details Modal -->
<Modal bind:open={showTicketModal} size="xl" class="w-full">
	{#if selectedTicket}
		<div class="space-y-6">
			<div class="flex justify-between items-start">
				<div>
					<h3 class="text-lg font-medium text-slate-900 dark:text-slate-50">{selectedTicket.subject}</h3>
					<p class="text-sm text-slate-500">Ticket #{selectedTicket.id}</p>
				</div>
				<div class="flex gap-2">
					<Badge color={getPriorityColor(selectedTicket.priority)}>{selectedTicket.priority}</Badge>
					<Badge color={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
				</div>
			</div>
			
			<div class="max-h-96 overflow-y-auto">
				<Timeline>
					{#each selectedTicket.messages as message}
						<TimelineItem title={message.sender} date={message.timestamp}>
							<div class="mt-2 p-3 rounded-lg {message.type === 'user' ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-slate-800'}">
								<p class="text-slate-700 dark:text-slate-300">{message.message}</p>
							</div>
						</TimelineItem>
					{/each}
				</Timeline>
			</div>
			
			{#if selectedTicket.status !== 'Closed' && selectedTicket.status !== 'Resolved'}
				<div class="border-t border-slate-200 dark:border-slate-700 pt-4">
					<Label for="newMessage" class="mb-2">Add Reply</Label>
					<Textarea id="newMessage" bind:value={newMessage} rows="3" placeholder="Type your message..." />
					<div class="flex gap-2 mt-3">
						<Button on:click={sendMessage} color="primary" disabled={!newMessage.trim()}>Send Reply</Button>
						<Button color="alternative">Close Ticket</Button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</Modal>
