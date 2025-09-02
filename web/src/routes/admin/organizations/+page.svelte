<script>
	import { onMount } from 'svelte';
	import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Button, Search, Pagination, Modal, Label, Input, Textarea, Select, Spinner, Alert, ButtonGroup } from 'flowbite-svelte';
	import { accountsApi } from '$lib/api/accounts';
	import { toastStore } from '$lib/stores/toast';

	// Data state
	let organizations = [];
	let selectedOrganization = null;
	let organizationStats = {};
	
	// UI state
	let isLoading = true;
	let isCreating = false;
	let isUpdating = false;
	let isDeleting = false;
	let isTogglingStatus = false;
	let error = null;
	
	// Search and pagination
	let searchTerm = '';
	let currentPage = 1;
	let itemsPerPage = 10;
	let totalPages = 1;
	let totalItems = 0;
	let statusFilter = '';
	let sortBy = 'name';
	let sortOrder = 'asc';
	
	// Modals state
	let showCreateModal = false;
	let showEditModal = false;
	let showViewModal = false;
	let showDeleteModal = false;
	
	// Form validation
	let formErrors = {};
	
	// Form data
	let createForm = {
		name: '',
		description: '',
		domain: '',
		settings: {}
	};
	
	let editForm = {
		id: null,
		name: '',
		description: '',
		domain: '',
		settings: {}
	};

	// Load organizations on mount
	onMount(() => {
		loadOrganizations();
	});

	// Reactive: reload when search/pagination changes with debounce
	let searchTimeout;
	$: {
		if (searchTimeout) clearTimeout(searchTimeout);
		searchTimeout = setTimeout(() => {
			if (searchTerm !== '' && currentPage === 1) {
				loadOrganizations();
			} else if (searchTerm === '' || currentPage !== 1) {
				loadOrganizations();
			}
		}, searchTerm ? 300 : 0);
	}
	
	$: if (currentPage !== undefined || statusFilter !== undefined || sortBy !== undefined || sortOrder !== undefined) {
		loadOrganizations();
	}

	async function loadOrganizations() {
		try {
			isLoading = true;
			error = null;
			
			const params = {
				page: currentPage,
				limit: itemsPerPage,
				search: searchTerm || undefined,
				status: statusFilter || undefined,
				sortBy,
				sortOrder
			};
			
			const result = await accountsApi.organizations.getAll(params);
			organizations = result.organizations || [];
			totalItems = result.totalItems || 0;
			totalPages = result.totalPages || 1;
			
		} catch (err) {
			error = err.message;
			toastStore.error('Failed to load organizations');
			console.error('Error loading organizations:', err);
		} finally {
			isLoading = false;
		}
	}

	// Form validation
	function validateCreateForm() {
		formErrors = {};
		
		if (!createForm.name.trim()) {
			formErrors.name = 'Organization name is required';
		} else if (createForm.name.trim().length < 2) {
			formErrors.name = 'Organization name must be at least 2 characters';
		}
		
		if (createForm.domain && !isValidDomain(createForm.domain)) {
			formErrors.domain = 'Please enter a valid domain (e.g., company.com)';
		}
		
		return Object.keys(formErrors).length === 0;
	}
	
	function validateEditForm() {
		formErrors = {};
		
		if (!editForm.name.trim()) {
			formErrors.name = 'Organization name is required';
		} else if (editForm.name.trim().length < 2) {
			formErrors.name = 'Organization name must be at least 2 characters';
		}
		
		if (editForm.domain && !isValidDomain(editForm.domain)) {
			formErrors.domain = 'Please enter a valid domain (e.g., company.com)';
		}
		
		return Object.keys(formErrors).length === 0;
	}
	
	function isValidDomain(domain) {
		const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
		return domainRegex.test(domain);
	}

	async function handleCreateOrganization() {
		if (!validateCreateForm()) {
			return;
		}
		
		try {
			isCreating = true;
			formErrors = {};
			
			const organizationData = {
				...createForm,
				name: createForm.name.trim(),
				description: createForm.description.trim(),
				domain: createForm.domain.trim()
			};
			
			await accountsApi.organizations.create(organizationData);
			
			toastStore.success('Organization created successfully');
			showCreateModal = false;
			resetCreateForm();
			await loadOrganizations();
			
		} catch (err) {
			if (err.response?.status === 409) {
				formErrors.name = 'Organization name already exists';
			} else if (err.response?.status === 422) {
				formErrors.domain = 'Domain already in use';
			} else {
				toastStore.error('Failed to create organization: ' + err.message);
			}
		} finally {
			isCreating = false;
		}
	}

	async function handleEditOrganization() {
		if (!validateEditForm()) {
			return;
		}
		
		try {
			isUpdating = true;
			formErrors = {};
			
			const { id, ...updateData } = editForm;
			const organizationData = {
				...updateData,
				name: updateData.name.trim(),
				description: updateData.description.trim(),
				domain: updateData.domain.trim()
			};
			
			await accountsApi.organizations.update(id, organizationData);
			
			toastStore.success('Organization updated successfully');
			showEditModal = false;
			resetEditForm();
			await loadOrganizations();
			
		} catch (err) {
			if (err.response?.status === 409) {
				formErrors.name = 'Organization name already exists';
			} else if (err.response?.status === 422) {
				formErrors.domain = 'Domain already in use';
			} else {
				toastStore.error('Failed to update organization: ' + err.message);
			}
		} finally {
			isUpdating = false;
		}
	}

	async function handleDeleteOrganization() {
		if (!selectedOrganization) return;
		
		try {
			isDeleting = true;
			
			await accountsApi.organizations.delete(selectedOrganization.id);
			
			toastStore.success('Organization deleted successfully');
			showDeleteModal = false;
			selectedOrganization = null;
			await loadOrganizations();
			
		} catch (err) {
			if (err.response?.status === 409) {
				toastStore.error('Cannot delete organization: it still has active users');
			} else {
				toastStore.error('Failed to delete organization: ' + err.message);
			}
		} finally {
			isDeleting = false;
		}
	}

	async function handleToggleStatus(org) {
		try {
			isTogglingStatus = true;
			const newStatus = !org.active;
			await accountsApi.organizations.toggleStatus(org.id, newStatus);
			
			toastStore.success(`Organization ${newStatus ? 'activated' : 'deactivated'} successfully`);
			await loadOrganizations();
			
		} catch (err) {
			toastStore.error('Failed to update organization status: ' + err.message);
		} finally {
			isTogglingStatus = false;
		}
	}

	async function viewOrganization(org) {
		selectedOrganization = org;
		showViewModal = true;
		
		// Load organization stats
		try {
			organizationStats = await accountsApi.organizations.getStats(org.id);
		} catch (err) {
			console.error('Failed to load organization stats:', err);
		}
	}

	function openCreateModal() {
		resetCreateForm();
		showCreateModal = true;
	}

	function openEditModal(org) {
		editForm = {
			id: org.id,
			name: org.name,
			description: org.description || '',
			domain: org.domain || '',
			settings: org.settings || {}
		};
		showEditModal = true;
	}

	function openDeleteModal(org) {
		selectedOrganization = org;
		showDeleteModal = true;
	}

	function resetCreateForm() {
		createForm = {
			name: '',
			description: '',
			domain: '',
			settings: {}
		};
		formErrors = {};
	}

	function resetEditForm() {
		editForm = {
			id: null,
			name: '',
			description: '',
			domain: '',
			settings: {}
		};
		formErrors = {};
	}

	function onPageChange(event) {
		currentPage = event.detail.page;
	}
	
	function formatDate(dateString) {
		if (!dateString) return 'N/A';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	function getStatusColor(status) {
		if (!status) return 'gray';
		return status.toLowerCase() === 'active' ? 'green' : 'red';
	}
	
	function getStatusBadgeText(organization) {
		if (!organization) return 'Unknown';
		return organization.active ? 'Active' : 'Inactive';
	}
	
	function clearFilters() {
		searchTerm = '';
		statusFilter = '';
		sortBy = 'name';
		sortOrder = 'asc';
		currentPage = 1;
	}
	
	function sortByColumn(column) {
		if (sortBy === column) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortOrder = 'asc';
		}
		currentPage = 1;
	}
</script>

<svelte:head>
	<title>Organizations - NOURX Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Organizations</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Manage client organizations and their settings</p>
		</div>
		<Button color="primary" size="sm" on:click={openCreateModal}>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
			</svg>
			New Organization
		</Button>
	</div>

	<!-- Error Display -->
	{#if error}
		<Alert color="red" dismissable on:close={() => error = null}>
			<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
				<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
			</svg>
			{error}
		</Alert>
	{/if}

	<!-- Filters and Stats -->
	<Card class="p-4">
		<div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
			<div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1">
				<Search bind:value={searchTerm} placeholder="Search organizations..." class="w-full sm:w-80" />
				<Select bind:value={statusFilter} placeholder="All Status" class="w-full sm:w-40">
					<option value="">All Status</option>
					<option value="active">Active</option>
					<option value="inactive">Inactive</option>
				</Select>
				<Button color="alternative" size="sm" on:click={clearFilters}>
					<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
					</svg>
					Clear
				</Button>
			</div>
			<div class="flex gap-2 flex-wrap">
				<Badge color="blue" large>
					<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
						<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Total: {totalItems}
				</Badge>
				{#if organizations.length}
					<Badge color="green" large>
						Active: {organizations.filter(org => org.active).length}
					</Badge>
					<Badge color="red" large>
						Inactive: {organizations.filter(org => !org.active).length}
					</Badge>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Organizations Table -->
	<Card>
		<div class="p-6 pb-2 flex justify-between items-center">
			<h2 class="text-lg font-semibold">Organizations List</h2>
			{#if isLoading}
				<Spinner size="4" />
			{/if}
		</div>
		
		{#if isLoading && organizations.length === 0}
			<div class="p-8 text-center">
				<Spinner size="6" />
				<p class="mt-2 text-slate-600 dark:text-slate-400">Loading organizations...</p>
			</div>
		{:else if organizations.length === 0}
			<div class="p-8 text-center">
				<svg class="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
				</svg>
				<p class="text-slate-600 dark:text-slate-400">No organizations found</p>
				{#if searchTerm || statusFilter}
					<Button color="alternative" size="sm" class="mt-2" on:click={clearFilters}>
						Clear filters
					</Button>
				{/if}
			</div>
		{:else}
			<Table hoverable>
				<TableHead>
					<TableHeadCell class="cursor-pointer" on:click={() => sortByColumn('name')}>
						<div class="flex items-center">
							Organization
							{#if sortBy === 'name'}
								<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
								</svg>
							{/if}
						</div>
					</TableHeadCell>
					<TableHeadCell>Domain</TableHeadCell>
					<TableHeadCell class="cursor-pointer" on:click={() => sortByColumn('userCount')}>
						<div class="flex items-center">
							Users
							{#if sortBy === 'userCount'}
								<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
								</svg>
							{/if}
						</div>
					</TableHeadCell>
					<TableHeadCell class="cursor-pointer" on:click={() => sortByColumn('active')}>
						<div class="flex items-center">
							Status
							{#if sortBy === 'active'}
								<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
								</svg>
							{/if}
						</div>
					</TableHeadCell>
					<TableHeadCell class="cursor-pointer" on:click={() => sortByColumn('createdAt')}>
						<div class="flex items-center">
							Created
							{#if sortBy === 'createdAt'}
								<svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={sortOrder === 'asc' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
								</svg>
							{/if}
						</div>
					</TableHeadCell>
					<TableHeadCell>Actions</TableHeadCell>
				</TableHead>
				<TableBody>
					{#each organizations as org (org.id)}
						<TableBodyRow>
							<TableBodyCell>
								<div>
									<div class="font-medium text-slate-900 dark:text-slate-50">{org.name}</div>
									<div class="text-sm text-slate-500">
										{#if org.description}
											{org.description}
										{:else}
											ID: {org.id}
										{/if}
									</div>
								</div>
							</TableBodyCell>
							<TableBodyCell>
								<div class="text-slate-600 dark:text-slate-400">
									{#if org.domain}
										<code class="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">{org.domain}</code>
									{:else}
										<span class="text-slate-400">No domain</span>
									{/if}
								</div>
							</TableBodyCell>
							<TableBodyCell>
								<Badge color="dark">{org.userCount || 0} users</Badge>
							</TableBodyCell>
							<TableBodyCell>
								<Badge color={getStatusColor(getStatusBadgeText(org))} class="cursor-pointer" on:click={() => handleToggleStatus(org)}>
									{getStatusBadgeText(org)}
									{#if isTogglingStatus}
										<Spinner size="3" class="ml-1" />
									{/if}
								</Badge>
							</TableBodyCell>
							<TableBodyCell class="text-slate-600 dark:text-slate-400">
								{formatDate(org.createdAt)}
							</TableBodyCell>
							<TableBodyCell>
								<ButtonGroup>
									<Button color="alternative" size="xs" on:click={() => viewOrganization(org)}>
										<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
										View
									</Button>
									<Button color="alternative" size="xs" on:click={() => openEditModal(org)}>
										<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
										</svg>
										Edit
									</Button>
									<Button color="red" size="xs" on:click={() => openDeleteModal(org)}>
										<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
										Delete
									</Button>
								</ButtonGroup>
							</TableBodyCell>
						</TableBodyRow>
					{/each}
				</TableBody>
			</Table>
		{/if}
		
		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
				<p class="text-sm text-slate-600 dark:text-slate-400">
					Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} organizations
				</p>
				<Pagination
					pages={Array.from({length: totalPages}, (_, i) => ({
						name: (i + 1).toString(),
						href: '#',
						active: i + 1 === currentPage
					}))}
					on:previous={() => currentPage > 1 && (currentPage -= 1)}
					on:next={() => currentPage < totalPages && (currentPage += 1)}
					on:click={(event) => onPageChange(event)}
				/>
			</div>
		{/if}
	</Card>
</div>

<!-- Create Organization Modal -->
<Modal bind:open={showCreateModal} size="md" autoclose={false}>
	<div class="p-6 space-y-6">
		<h3 class="text-xl font-semibold text-slate-900 dark:text-white">Create New Organization</h3>
		
		<form on:submit|preventDefault={handleCreateOrganization} class="space-y-4">
			<div>
				<Label for="create-name" class="block text-sm font-medium mb-2">Organization Name*</Label>
				<Input
					id="create-name"
					type="text"
					bind:value={createForm.name}
					placeholder="Enter organization name"
					class={formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
					disabled={isCreating}
					required
				/>
				{#if formErrors.name}
					<p class="mt-1 text-sm text-red-600">{formErrors.name}</p>
				{/if}
			</div>
			
			<div>
				<Label for="create-description" class="block text-sm font-medium mb-2">Description</Label>
				<Textarea
					id="create-description"
					bind:value={createForm.description}
					placeholder="Enter organization description (optional)"
					rows="3"
					disabled={isCreating}
				/>
			</div>
			
			<div>
				<Label for="create-domain" class="block text-sm font-medium mb-2">Domain</Label>
				<Input
					id="create-domain"
					type="text"
					bind:value={createForm.domain}
					placeholder="company.com (optional)"
					class={formErrors.domain ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
					disabled={isCreating}
				/>
				{#if formErrors.domain}
					<p class="mt-1 text-sm text-red-600">{formErrors.domain}</p>
				{/if}
			</div>
			
			<div class="flex justify-end gap-3 pt-4">
				<Button color="alternative" on:click={() => showCreateModal = false} disabled={isCreating}>
					Cancel
				</Button>
				<Button type="submit" color="primary" disabled={isCreating}>
					{#if isCreating}
						<Spinner size="4" class="mr-2" />
						Creating...
					{:else}
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Create Organization
					{/if}
				</Button>
			</div>
		</form>
	</div>
</Modal>

<!-- Edit Organization Modal -->
<Modal bind:open={showEditModal} size="md" autoclose={false}>
	<div class="p-6 space-y-6">
		<h3 class="text-xl font-semibold text-slate-900 dark:text-white">Edit Organization</h3>
		
		<form on:submit|preventDefault={handleEditOrganization} class="space-y-4">
			<div>
				<Label for="edit-name" class="block text-sm font-medium mb-2">Organization Name*</Label>
				<Input
					id="edit-name"
					type="text"
					bind:value={editForm.name}
					placeholder="Enter organization name"
					class={formErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
					disabled={isUpdating}
					required
				/>
				{#if formErrors.name}
					<p class="mt-1 text-sm text-red-600">{formErrors.name}</p>
				{/if}
			</div>
			
			<div>
				<Label for="edit-description" class="block text-sm font-medium mb-2">Description</Label>
				<Textarea
					id="edit-description"
					bind:value={editForm.description}
					placeholder="Enter organization description (optional)"
					rows="3"
					disabled={isUpdating}
				/>
			</div>
			
			<div>
				<Label for="edit-domain" class="block text-sm font-medium mb-2">Domain</Label>
				<Input
					id="edit-domain"
					type="text"
					bind:value={editForm.domain}
					placeholder="company.com (optional)"
					class={formErrors.domain ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
					disabled={isUpdating}
				/>
				{#if formErrors.domain}
					<p class="mt-1 text-sm text-red-600">{formErrors.domain}</p>
				{/if}
			</div>
			
			<div class="flex justify-end gap-3 pt-4">
				<Button color="alternative" on:click={() => showEditModal = false} disabled={isUpdating}>
					Cancel
				</Button>
				<Button type="submit" color="primary" disabled={isUpdating}>
					{#if isUpdating}
						<Spinner size="4" class="mr-2" />
						Updating...
					{:else}
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
						Update Organization
					{/if}
				</Button>
			</div>
		</form>
	</div>
</Modal>

<!-- View Organization Modal -->
<Modal bind:open={showViewModal} size="lg" autoclose={false}>
	{#if selectedOrganization}
		<div class="p-6 space-y-6">
			<div class="flex justify-between items-start">
				<div>
					<h3 class="text-xl font-semibold text-slate-900 dark:text-white">{selectedOrganization.name}</h3>
					<p class="text-slate-600 dark:text-slate-400">Organization Details</p>
				</div>
				<Badge color={getStatusColor(getStatusBadgeText(selectedOrganization))} large>
					{getStatusBadgeText(selectedOrganization)}
				</Badge>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-4">
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Organization ID</Label>
						<p class="mt-1 text-slate-900 dark:text-white font-mono text-sm">{selectedOrganization.id}</p>
					</div>
					
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Name</Label>
						<p class="mt-1 text-slate-900 dark:text-white">{selectedOrganization.name}</p>
					</div>
					
					{#if selectedOrganization.description}
						<div>
							<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
							<p class="mt-1 text-slate-900 dark:text-white">{selectedOrganization.description}</p>
						</div>
					{/if}
					
					{#if selectedOrganization.domain}
						<div>
							<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Domain</Label>
							<p class="mt-1 text-slate-900 dark:text-white font-mono text-sm">{selectedOrganization.domain}</p>
						</div>
					{/if}
				</div>
				
				<div class="space-y-4">
					{#if organizationStats}
						<div>
							<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Statistics</Label>
							<div class="mt-2 space-y-2">
								<div class="flex justify-between">
									<span class="text-slate-600 dark:text-slate-400">Total Users:</span>
									<Badge color="dark">{organizationStats.totalUsers || 0}</Badge>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-600 dark:text-slate-400">Active Users:</span>
									<Badge color="green">{organizationStats.activeUsers || 0}</Badge>
								</div>
								<div class="flex justify-between">
									<span class="text-slate-600 dark:text-slate-400">Total Projects:</span>
									<Badge color="blue">{organizationStats.totalProjects || 0}</Badge>
								</div>
							</div>
						</div>
					{/if}
					
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Created</Label>
						<p class="mt-1 text-slate-900 dark:text-white">{formatDate(selectedOrganization.createdAt)}</p>
					</div>
					
					{#if selectedOrganization.updatedAt}
						<div>
							<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Last Updated</Label>
							<p class="mt-1 text-slate-900 dark:text-white">{formatDate(selectedOrganization.updatedAt)}</p>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
				<Button color="alternative" on:click={() => showViewModal = false}>
					Close
				</Button>
				<Button color="primary" on:click={() => { showViewModal = false; openEditModal(selectedOrganization); }}>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
					Edit Organization
				</Button>
			</div>
		</div>
	{/if}
</Modal>

<!-- Delete Organization Modal -->
<Modal bind:open={showDeleteModal} size="md" autoclose={false}>
	{#if selectedOrganization}
		<div class="p-6 space-y-6">
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Delete Organization</h3>
					<p class="text-slate-600 dark:text-slate-400 mt-2">
						Are you sure you want to delete <strong class="text-slate-900 dark:text-white">"{selectedOrganization.name}"</strong>? 
						This action cannot be undone and will remove all associated data.
					</p>
					
					{#if selectedOrganization.userCount && selectedOrganization.userCount > 0}
						<div class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
							<div class="flex items-center gap-2 text-red-700 dark:text-red-400">
								<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
								</svg>
								<span class="text-sm font-medium">Warning: This organization has {selectedOrganization.userCount} user{selectedOrganization.userCount === 1 ? '' : 's'}.</span>
							</div>
						</div>
					{/if}
				</div>
			</div>
			
			<div class="flex justify-end gap-3">
				<Button color="alternative" on:click={() => showDeleteModal = false} disabled={isDeleting}>
					Cancel
				</Button>
				<Button color="red" on:click={handleDeleteOrganization} disabled={isDeleting}>
					{#if isDeleting}
						<Spinner size="4" class="mr-2" />
						Deleting...
					{:else}
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
						Delete Organization
					{/if}
				</Button>
			</div>
		</div>
	{/if}
</Modal>
