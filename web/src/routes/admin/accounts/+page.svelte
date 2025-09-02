<script>
	import { onMount } from 'svelte';
	import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Button, Search, Pagination, Tabs, TabItem, Modal, Label, Input, Select, Spinner, Alert, ButtonGroup } from 'flowbite-svelte';
	import { accountsApi } from '$lib/api/accounts';
	import { toastStore } from '$lib/stores/toast';

	// Data state
	let organizations = [];
	let users = [];
	let adminUsers = [];
	let selectedOrganization = null;
	let selectedUser = null;
	
	// UI state
	let isLoading = true;
	let isCreating = false;
	let isUpdating = false;
	let isDeleting = false;
	let isInviting = false;
	let isResettingPassword = false;
	let error = null;
	
	// Search and pagination for each tab
	let clientSearchTerm = '';
	let adminSearchTerm = '';
	let clientCurrentPage = 1;
	let adminCurrentPage = 1;
	let itemsPerPage = 10;
	let clientTotalPages = 1;
	let adminTotalPages = 1;
	let clientTotalItems = 0;
	let adminTotalItems = 0;
	
	// Filters
	let roleFilter = '';
	let statusFilter = '';
	let organizationFilter = '';
	
	// Modals state
	let showInviteModal = false;
	let showEditUserModal = false;
	let showDeleteUserModal = false;
	let showViewUserModal = false;
	let showResetPasswordModal = false;
	
	// Form validation
	let formErrors = {};
	
	// Form data
	let inviteForm = {
		organizationId: '',
		email: '',
		firstName: '',
		lastName: '',
		role: 'reader'
	};
	
	let editUserForm = {
		id: null,
		firstName: '',
		lastName: '',
		email: '',
		role: '',
		active: true
	};
	
	// Available roles
	const userRoles = [
		{ value: 'owner', label: 'Owner', color: 'purple' },
		{ value: 'manager', label: 'Manager', color: 'blue' },
		{ value: 'reader', label: 'Reader', color: 'gray' }
	];
	
	// Load data on mount
	onMount(() => {
		loadOrganizations();
		loadUsers();
		loadAdminUsers();
	});
	
	// Reactive: reload users when filters change
	let clientSearchTimeout;
	let adminSearchTimeout;
	
	$: {
		if (clientSearchTimeout) clearTimeout(clientSearchTimeout);
		clientSearchTimeout = setTimeout(() => {
			if (clientSearchTerm !== '' || clientCurrentPage !== 1) {
				loadUsers();
			} else if (clientSearchTerm === '') {
				loadUsers();
			}
		}, clientSearchTerm ? 300 : 0);
	}
	
	$: {
		if (adminSearchTimeout) clearTimeout(adminSearchTimeout);
		adminSearchTimeout = setTimeout(() => {
			if (adminSearchTerm !== '' || adminCurrentPage !== 1) {
				loadAdminUsers();
			} else if (adminSearchTerm === '') {
				loadAdminUsers();
			}
		}, adminSearchTerm ? 300 : 0);
	}
	
	$: if (clientCurrentPage || roleFilter !== undefined || statusFilter !== undefined || organizationFilter !== undefined) {
		loadUsers();
	}
	
	$: if (adminCurrentPage) {
		loadAdminUsers();
	}

	async function loadOrganizations() {
		try {
			const result = await accountsApi.organizations.getAll({ page: 1, limit: 1000 });
			organizations = result.organizations || [];
		} catch (err) {
			console.error('Error loading organizations:', err);
			toastStore.error('Failed to load organizations');
		}
	}

	async function loadUsers() {
		try {
			isLoading = true;
			error = null;
			
			const params = {
				page: clientCurrentPage,
				limit: itemsPerPage,
				search: clientSearchTerm || undefined,
				role: roleFilter || undefined,
				status: statusFilter || undefined,
				organizationId: organizationFilter || undefined
			};
			
			const result = await accountsApi.users.getAll(params);
			users = result.users || [];
			clientTotalItems = result.totalItems || 0;
			clientTotalPages = result.totalPages || 1;
			
		} catch (err) {
			error = err.message;
			toastStore.error('Failed to load users');
			console.error('Error loading users:', err);
		} finally {
			isLoading = false;
		}
	}

	async function loadAdminUsers() {
		try {
			const params = {
				page: adminCurrentPage,
				limit: itemsPerPage,
				search: adminSearchTerm || undefined
			};
			
			const result = await accountsApi.admins.getAll(params);
			adminUsers = result.users || [];
			adminTotalItems = result.totalItems || 0;
			adminTotalPages = result.totalPages || 1;
			
		} catch (err) {
			console.error('Error loading admin users:', err);
			toastStore.error('Failed to load admin users');
		}
	}

	// Form validation
	function validateInviteForm() {
		formErrors = {};
		
		if (!inviteForm.organizationId) {
			formErrors.organizationId = 'Please select an organization';
		}
		
		if (!inviteForm.email.trim()) {
			formErrors.email = 'Email is required';
		} else if (!isValidEmail(inviteForm.email)) {
			formErrors.email = 'Please enter a valid email address';
		}
		
		if (!inviteForm.firstName.trim()) {
			formErrors.firstName = 'First name is required';
		}
		
		if (!inviteForm.lastName.trim()) {
			formErrors.lastName = 'Last name is required';
		}
		
		if (!inviteForm.role) {
			formErrors.role = 'Please select a role';
		}
		
		return Object.keys(formErrors).length === 0;
	}
	
	function validateEditUserForm() {
		formErrors = {};
		
		if (!editUserForm.firstName.trim()) {
			formErrors.firstName = 'First name is required';
		}
		
		if (!editUserForm.lastName.trim()) {
			formErrors.lastName = 'Last name is required';
		}
		
		if (!editUserForm.email.trim()) {
			formErrors.email = 'Email is required';
		} else if (!isValidEmail(editUserForm.email)) {
			formErrors.email = 'Please enter a valid email address';
		}
		
		if (!editUserForm.role) {
			formErrors.role = 'Please select a role';
		}
		
		return Object.keys(formErrors).length === 0;
	}
	
	function isValidEmail(email) {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// User management functions
	async function handleInviteUser() {
		if (!validateInviteForm()) {
			return;
		}
		
		try {
			isInviting = true;
			formErrors = {};
			
			const inviteData = {
				email: inviteForm.email.trim(),
				firstName: inviteForm.firstName.trim(),
				lastName: inviteForm.lastName.trim(),
				role: inviteForm.role
			};
			
			await accountsApi.users.invite(inviteForm.organizationId, inviteData);
			
			toastStore.success('User invitation sent successfully');
			showInviteModal = false;
			resetInviteForm();
			await loadUsers();
			
		} catch (err) {
			if (err.response?.status === 409) {
				formErrors.email = 'User with this email already exists';
			} else {
				toastStore.error('Failed to invite user: ' + err.message);
			}
		} finally {
			isInviting = false;
		}
	}

	async function handleEditUser() {
		if (!validateEditUserForm()) {
			return;
		}
		
		try {
			isUpdating = true;
			formErrors = {};
			
			const { id, ...updateData } = editUserForm;
			const userData = {
				firstName: updateData.firstName.trim(),
				lastName: updateData.lastName.trim(),
				email: updateData.email.trim(),
				role: updateData.role,
				active: updateData.active
			};
			
			await accountsApi.users.update(id, userData);
			
			toastStore.success('User updated successfully');
			showEditUserModal = false;
			resetEditUserForm();
			await loadUsers();
			
		} catch (err) {
			if (err.response?.status === 409) {
				formErrors.email = 'User with this email already exists';
			} else {
				toastStore.error('Failed to update user: ' + err.message);
			}
		} finally {
			isUpdating = false;
		}
	}

	async function handleDeleteUser() {
		if (!selectedUser) return;
		
		try {
			isDeleting = true;
			
			await accountsApi.users.delete(selectedUser.id);
			
			toastStore.success('User deleted successfully');
			showDeleteUserModal = false;
			selectedUser = null;
			await loadUsers();
			
		} catch (err) {
			toastStore.error('Failed to delete user: ' + err.message);
		} finally {
			isDeleting = false;
		}
	}

	async function handleToggleUserStatus(user) {
		try {
			const newStatus = !user.active;
			await accountsApi.users.toggleStatus(user.id, newStatus);
			
			toastStore.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
			await loadUsers();
			
		} catch (err) {
			toastStore.error('Failed to update user status: ' + err.message);
		}
	}

	async function handleChangeUserRole(user, newRole) {
		try {
			await accountsApi.users.updateRole(user.id, newRole);
			
			toastStore.success('User role updated successfully');
			await loadUsers();
			
		} catch (err) {
			toastStore.error('Failed to update user role: ' + err.message);
		}
	}

	async function handleResetPassword(user) {
		try {
			isResettingPassword = true;
			
			await accountsApi.users.resetPassword(user.id);
			
			toastStore.success('Password reset email sent to user');
			showResetPasswordModal = false;
			selectedUser = null;
			
		} catch (err) {
			toastStore.error('Failed to reset password: ' + err.message);
		} finally {
			isResettingPassword = false;
		}
	}

	async function handleResendInvite(user) {
		try {
			await accountsApi.users.resendInvite(user.id);
			
			toastStore.success('Invitation resent successfully');
			
		} catch (err) {
			toastStore.error('Failed to resend invitation: ' + err.message);
		}
	}

	// Modal management
	function openInviteModal() {
		resetInviteForm();
		showInviteModal = true;
	}

	function openEditUserModal(user) {
		editUserForm = {
			id: user.id,
			firstName: user.firstName || '',
			lastName: user.lastName || '',
			email: user.email || '',
			role: user.role || '',
			active: user.active !== false
		};
		showEditUserModal = true;
	}

	function openDeleteUserModal(user) {
		selectedUser = user;
		showDeleteUserModal = true;
	}

	function viewUser(user) {
		selectedUser = user;
		showViewUserModal = true;
	}

	function openResetPasswordModal(user) {
		selectedUser = user;
		showResetPasswordModal = true;
	}

	// Form reset functions
	function resetInviteForm() {
		inviteForm = {
			organizationId: '',
			email: '',
			firstName: '',
			lastName: '',
			role: 'reader'
		};
		formErrors = {};
	}

	function resetEditUserForm() {
		editUserForm = {
			id: null,
			firstName: '',
			lastName: '',
			email: '',
			role: '',
			active: true
		};
		formErrors = {};
	}

	// Utility functions
	function formatDate(dateString) {
		if (!dateString) return 'Never';
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
	
	function getStatusColor(status) {
		return status?.toLowerCase() === 'active' ? 'green' : 'red';
	}
	
	function getRoleColor(role) {
		const roleObj = userRoles.find(r => r.value === role?.toLowerCase());
		return roleObj?.color || 'gray';
	}
	
	function getRoleLabel(role) {
		const roleObj = userRoles.find(r => r.value === role?.toLowerCase());
		return roleObj?.label || role;
	}
	
	function getUserFullName(user) {
		if (user.firstName && user.lastName) {
			return `${user.firstName} ${user.lastName}`;
		}
		return user.email || 'Unknown User';
	}
	
	function getOrganizationName(organizationId) {
		const org = organizations.find(o => o.id === organizationId);
		return org?.name || 'Unknown Organization';
	}
	
	function clearClientFilters() {
		clientSearchTerm = '';
		roleFilter = '';
		statusFilter = '';
		organizationFilter = '';
		clientCurrentPage = 1;
	}
	
	function clearAdminFilters() {
		adminSearchTerm = '';
		adminCurrentPage = 1;
	}

	function onClientPageChange(event) {
		clientCurrentPage = event.detail.page;
	}
	
	function onAdminPageChange(event) {
		adminCurrentPage = event.detail.page;
	}
</script>

<svelte:head>
	<title>User Accounts - NOURX Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">User Accounts</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Manage client and admin user accounts</p>
		</div>
		<Button color="primary" size="sm" on:click={openInviteModal}>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
			</svg>
			Invite User
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

	<!-- User Management Tabs -->
	<Tabs>
		<TabItem open title="Client Users">
			<!-- Client Users Filters -->
			<Card class="p-4 mb-4">
				<div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
					<div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1">
						<Search bind:value={clientSearchTerm} placeholder="Search users..." class="w-full sm:w-80" />
						<Select bind:value={organizationFilter} placeholder="All Organizations" class="w-full sm:w-48">
							<option value="">All Organizations</option>
							{#each organizations as org}
								<option value={org.id}>{org.name}</option>
							{/each}
						</Select>
						<Select bind:value={roleFilter} placeholder="All Roles" class="w-full sm:w-36">
							<option value="">All Roles</option>
							{#each userRoles as role}
								<option value={role.value}>{role.label}</option>
							{/each}
						</Select>
						<Select bind:value={statusFilter} placeholder="All Status" class="w-full sm:w-36">
							<option value="">All Status</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</Select>
						<Button color="alternative" size="sm" on:click={clearClientFilters}>
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
							Total: {clientTotalItems}
						</Badge>
						{#if users.length}
							<Badge color="green" large>
								Active: {users.filter(user => user.active).length}
							</Badge>
							<Badge color="red" large>
								Inactive: {users.filter(user => !user.active).length}
							</Badge>
						{/if}
					</div>
				</div>
			</Card>

			<!-- Client Users Table -->
			<Card>
				<div class="p-6 pb-2 flex justify-between items-center">
					<h2 class="text-lg font-semibold">Client Users</h2>
					{#if isLoading}
						<Spinner size="4" />
					{/if}
				</div>
				
				{#if isLoading && users.length === 0}
					<div class="p-8 text-center">
						<Spinner size="6" />
						<p class="mt-2 text-slate-600 dark:text-slate-400">Loading users...</p>
					</div>
				{:else if users.length === 0}
					<div class="p-8 text-center">
						<svg class="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						<p class="text-slate-600 dark:text-slate-400">No users found</p>
						{#if clientSearchTerm || organizationFilter || roleFilter || statusFilter}
							<Button color="alternative" size="sm" class="mt-2" on:click={clearClientFilters}>
								Clear filters
							</Button>
						{/if}
					</div>
				{:else}
					<Table hoverable>
						<TableHead>
							<TableHeadCell>User</TableHeadCell>
							<TableHeadCell>Role</TableHeadCell>
							<TableHeadCell>Organization</TableHeadCell>
							<TableHeadCell>Status</TableHeadCell>
							<TableHeadCell>Last Login</TableHeadCell>
							<TableHeadCell>Actions</TableHeadCell>
						</TableHead>
						<TableBody>
							{#each users as user (user.id)}
								<TableBodyRow>
									<TableBodyCell>
										<div>
											<div class="font-medium text-slate-900 dark:text-slate-50">
												{getUserFullName(user)}
											</div>
											<div class="text-sm text-slate-500">{user.email}</div>
										</div>
									</TableBodyCell>
									<TableBodyCell>
										<Select bind:value={user.role} on:change={(e) => handleChangeUserRole(user, e.target.value)} class="w-32">
											{#each userRoles as role}
												<option value={role.value}>{role.label}</option>
											{/each}
										</Select>
									</TableBodyCell>
									<TableBodyCell class="text-slate-600 dark:text-slate-400">
										{getOrganizationName(user.organizationId)}
									</TableBodyCell>
									<TableBodyCell>
										<Badge 
											color={getStatusColor(user.active ? 'Active' : 'Inactive')} 
											class="cursor-pointer" 
											on:click={() => handleToggleUserStatus(user)}
										>
											{user.active ? 'Active' : 'Inactive'}
										</Badge>
									</TableBodyCell>
									<TableBodyCell class="text-slate-600 dark:text-slate-400">
										{formatDate(user.lastLoginAt)}
									</TableBodyCell>
									<TableBodyCell>
										<ButtonGroup>
											<Button color="alternative" size="xs" on:click={() => viewUser(user)}>
												<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
												</svg>
												View
											</Button>
											<Button color="alternative" size="xs" on:click={() => openEditUserModal(user)}>
												<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
												Edit
											</Button>
											<Button color="alternative" size="xs" on:click={() => openResetPasswordModal(user)}>
												<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
												</svg>
												Reset
											</Button>
											<Button color="red" size="xs" on:click={() => openDeleteUserModal(user)}>
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
				
				<!-- Client Users Pagination -->
				{#if clientTotalPages > 1}
					<div class="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
						<p class="text-sm text-slate-600 dark:text-slate-400">
							Showing {(clientCurrentPage - 1) * itemsPerPage + 1} to {Math.min(clientCurrentPage * itemsPerPage, clientTotalItems)} of {clientTotalItems} users
						</p>
						<Pagination
							pages={Array.from({length: clientTotalPages}, (_, i) => ({
								name: (i + 1).toString(),
								href: '#',
								active: i + 1 === clientCurrentPage
							}))}
							on:previous={() => clientCurrentPage > 1 && (clientCurrentPage -= 1)}
							on:next={() => clientCurrentPage < clientTotalPages && (clientCurrentPage += 1)}
							on:click={(event) => onClientPageChange(event)}
						/>
					</div>
				{/if}
			</Card>
		</TabItem>

		<TabItem title="Admin Users">
			<!-- Admin Users Filters -->
			<Card class="p-4 mb-4">
				<div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
					<div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center flex-1">
						<Search bind:value={adminSearchTerm} placeholder="Search admin users..." class="w-full sm:w-80" />
						<Button color="alternative" size="sm" on:click={clearAdminFilters}>
							<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
							Clear
						</Button>
					</div>
					<div class="flex gap-2 flex-wrap">
						<Badge color="purple" large>
							<svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							Total: {adminTotalItems}
						</Badge>
					</div>
				</div>
			</Card>

			<!-- Admin Users Table -->
			<Card>
				<div class="p-6 pb-2">
					<h2 class="text-lg font-semibold">Admin Users</h2>
				</div>
				
				{#if adminUsers.length === 0}
					<div class="p-8 text-center">
						<svg class="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
						<p class="text-slate-600 dark:text-slate-400">No admin users found</p>
						{#if adminSearchTerm}
							<Button color="alternative" size="sm" class="mt-2" on:click={clearAdminFilters}>
								Clear search
							</Button>
						{/if}
					</div>
				{:else}
					<Table hoverable>
						<TableHead>
							<TableHeadCell>User</TableHeadCell>
							<TableHeadCell>Role</TableHeadCell>
							<TableHeadCell>Status</TableHeadCell>
							<TableHeadCell>Last Login</TableHeadCell>
							<TableHeadCell>Actions</TableHeadCell>
						</TableHead>
						<TableBody>
							{#each adminUsers as user (user.id)}
								<TableBodyRow>
									<TableBodyCell>
										<div>
											<div class="font-medium text-slate-900 dark:text-slate-50">
												{getUserFullName(user)}
											</div>
											<div class="text-sm text-slate-500">{user.email}</div>
										</div>
									</TableBodyCell>
									<TableBodyCell>
										<Badge color="purple">{user.role || 'Admin'}</Badge>
									</TableBodyCell>
									<TableBodyCell>
										<Badge color={getStatusColor(user.active ? 'Active' : 'Inactive')}>
											{user.active ? 'Active' : 'Inactive'}
										</Badge>
									</TableBodyCell>
									<TableBodyCell class="text-slate-600 dark:text-slate-400">
										{formatDate(user.lastLoginAt)}
									</TableBodyCell>
									<TableBodyCell>
										<ButtonGroup>
											<Button color="alternative" size="xs" on:click={() => viewUser(user)}>
												<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
												</svg>
												View
											</Button>
											<Button color="alternative" size="xs">
												<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
												</svg>
												Edit
											</Button>
										</ButtonGroup>
									</TableBodyCell>
								</TableBodyRow>
							{/each}
						</TableBody>
					</Table>
				{/if}
				
				<!-- Admin Users Pagination -->
				{#if adminTotalPages > 1}
					<div class="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
						<p class="text-sm text-slate-600 dark:text-slate-400">
							Showing {(adminCurrentPage - 1) * itemsPerPage + 1} to {Math.min(adminCurrentPage * itemsPerPage, adminTotalItems)} of {adminTotalItems} admin users
						</p>
						<Pagination
							pages={Array.from({length: adminTotalPages}, (_, i) => ({
								name: (i + 1).toString(),
								href: '#',
								active: i + 1 === adminCurrentPage
							}))}
							on:previous={() => adminCurrentPage > 1 && (adminCurrentPage -= 1)}
							on:next={() => adminCurrentPage < adminTotalPages && (adminCurrentPage += 1)}
							on:click={(event) => onAdminPageChange(event)}
						/>
					</div>
				{/if}
			</Card>
		</TabItem>
	</Tabs>
</div>

<!-- Invite User Modal -->
<Modal bind:open={showInviteModal} size="md" autoclose={false}>
	<div class="p-6 space-y-6">
		<h3 class="text-xl font-semibold text-slate-900 dark:text-white">Invite New User</h3>
		
		<form on:submit|preventDefault={handleInviteUser} class="space-y-4">
			<div>
				<Label for="invite-org" class="block text-sm font-medium mb-2">Organization*</Label>
				<Select
					id="invite-org"
					bind:value={inviteForm.organizationId}
					class={formErrors.organizationId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
					disabled={isInviting}
					placeholder="Select an organization"
					required
				>
					<option value="">Select an organization</option>
					{#each organizations as org}
						<option value={org.id}>{org.name}</option>
					{/each}
				</Select>
				{#if formErrors.organizationId}
					<p class="mt-1 text-sm text-red-600">{formErrors.organizationId}</p>
				{/if}
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label for="invite-firstName" class="block text-sm font-medium mb-2">First Name*</Label>
					<Input
						id="invite-firstName"
						type="text"
						bind:value={inviteForm.firstName}
						placeholder="Enter first name"
						class={formErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
						disabled={isInviting}
						required
					/>
					{#if formErrors.firstName}
						<p class="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
					{/if}
				</div>
				
				<div>
					<Label for="invite-lastName" class="block text-sm font-medium mb-2">Last Name*</Label>
					<Input
						id="invite-lastName"
						type="text"
						bind:value={inviteForm.lastName}
						placeholder="Enter last name"
						class={formErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
						disabled={isInviting}
						required
					/>
					{#if formErrors.lastName}
						<p class="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
					{/if}
				</div>
			</div>
			
			<div>
				<Label for="invite-email" class="block text-sm font-medium mb-2">Email Address*</Label>
				<Input
					id="invite-email"
					type="email"
					bind:value={inviteForm.email}
					placeholder="user@company.com"
					class={formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
					disabled={isInviting}
					required
				/>
				{#if formErrors.email}
					<p class="mt-1 text-sm text-red-600">{formErrors.email}</p>
				{/if}
			</div>
			
			<div>
				<Label for="invite-role" class="block text-sm font-medium mb-2">Role*</Label>
				<Select
					id="invite-role"
					bind:value={inviteForm.role}
					class={formErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
					disabled={isInviting}
					required
				>
					{#each userRoles as role}
						<option value={role.value}>{role.label}</option>
					{/each}
				</Select>
				{#if formErrors.role}
					<p class="mt-1 text-sm text-red-600">{formErrors.role}</p>
				{/if}
			</div>
			
			<div class="flex justify-end gap-3 pt-4">
				<Button color="alternative" on:click={() => showInviteModal = false} disabled={isInviting}>
					Cancel
				</Button>
				<Button type="submit" color="primary" disabled={isInviting}>
					{#if isInviting}
						<Spinner size="4" class="mr-2" />
						Sending Invitation...
					{:else}
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Send Invitation
					{/if}
				</Button>
			</div>
		</form>
	</div>
</Modal>

<!-- Edit User Modal -->
<Modal bind:open={showEditUserModal} size="md" autoclose={false}>
	<div class="p-6 space-y-6">
		<h3 class="text-xl font-semibold text-slate-900 dark:text-white">Edit User</h3>
		
		<form on:submit|preventDefault={handleEditUser} class="space-y-4">
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<Label for="edit-firstName" class="block text-sm font-medium mb-2">First Name*</Label>
					<Input
						id="edit-firstName"
						type="text"
						bind:value={editUserForm.firstName}
						placeholder="Enter first name"
						class={formErrors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
						disabled={isUpdating}
						required
					/>
					{#if formErrors.firstName}
						<p class="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
					{/if}
				</div>
				
				<div>
					<Label for="edit-lastName" class="block text-sm font-medium mb-2">Last Name*</Label>
					<Input
						id="edit-lastName"
						type="text"
						bind:value={editUserForm.lastName}
						placeholder="Enter last name"
						class={formErrors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
						disabled={isUpdating}
						required
					/>
					{#if formErrors.lastName}
						<p class="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
					{/if}
				</div>
			</div>
			
			<div>
				<Label for="edit-email" class="block text-sm font-medium mb-2">Email Address*</Label>
				<Input
					id="edit-email"
					type="email"
					bind:value={editUserForm.email}
					placeholder="user@company.com"
					class={formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
					disabled={isUpdating}
					required
				/>
				{#if formErrors.email}
					<p class="mt-1 text-sm text-red-600">{formErrors.email}</p>
				{/if}
			</div>
			
			<div>
				<Label for="edit-role" class="block text-sm font-medium mb-2">Role*</Label>
				<Select
					id="edit-role"
					bind:value={editUserForm.role}
					class={formErrors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
					disabled={isUpdating}
					required
				>
					{#each userRoles as role}
						<option value={role.value}>{role.label}</option>
					{/each}
				</Select>
				{#if formErrors.role}
					<p class="mt-1 text-sm text-red-600">{formErrors.role}</p>
				{/if}
			</div>
			
			<div class="flex items-center">
				<input
					id="edit-active"
					type="checkbox"
					bind:checked={editUserForm.active}
					class="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
					disabled={isUpdating}
				/>
				<Label for="edit-active" class="ml-2 text-sm font-medium text-slate-900 dark:text-slate-300">
					Account is active
				</Label>
			</div>
			
			<div class="flex justify-end gap-3 pt-4">
				<Button color="alternative" on:click={() => showEditUserModal = false} disabled={isUpdating}>
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
						Update User
					{/if}
				</Button>
			</div>
		</form>
	</div>
</Modal>

<!-- View User Modal -->
<Modal bind:open={showViewUserModal} size="lg" autoclose={false}>
	{#if selectedUser}
		<div class="p-6 space-y-6">
			<div class="flex justify-between items-start">
				<div>
					<h3 class="text-xl font-semibold text-slate-900 dark:text-white">{getUserFullName(selectedUser)}</h3>
					<p class="text-slate-600 dark:text-slate-400">User Details</p>
				</div>
				<div class="flex gap-2">
					<Badge color={getStatusColor(selectedUser.active ? 'Active' : 'Inactive')} large>
						{selectedUser.active ? 'Active' : 'Inactive'}
					</Badge>
					<Badge color={getRoleColor(selectedUser.role)} large>
						{getRoleLabel(selectedUser.role)}
					</Badge>
				</div>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div class="space-y-4">
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">User ID</Label>
						<p class="mt-1 text-slate-900 dark:text-white font-mono text-sm">{selectedUser.id}</p>
					</div>
					
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</Label>
						<p class="mt-1 text-slate-900 dark:text-white">{getUserFullName(selectedUser)}</p>
					</div>
					
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</Label>
						<p class="mt-1 text-slate-900 dark:text-white font-mono text-sm">{selectedUser.email}</p>
					</div>
					
					{#if selectedUser.organizationId}
						<div>
							<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Organization</Label>
							<p class="mt-1 text-slate-900 dark:text-white">{getOrganizationName(selectedUser.organizationId)}</p>
						</div>
					{/if}
				</div>
				
				<div class="space-y-4">
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Role</Label>
						<p class="mt-1">
							<Badge color={getRoleColor(selectedUser.role)}>{getRoleLabel(selectedUser.role)}</Badge>
						</p>
					</div>
					
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Status</Label>
						<p class="mt-1">
							<Badge color={getStatusColor(selectedUser.active ? 'Active' : 'Inactive')}>
								{selectedUser.active ? 'Active' : 'Inactive'}
							</Badge>
						</p>
					</div>
					
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Last Login</Label>
						<p class="mt-1 text-slate-900 dark:text-white">{formatDate(selectedUser.lastLoginAt)}</p>
					</div>
					
					<div>
						<Label class="text-sm font-medium text-slate-700 dark:text-slate-300">Created</Label>
						<p class="mt-1 text-slate-900 dark:text-white">{formatDate(selectedUser.createdAt)}</p>
					</div>
				</div>
			</div>
			
			<div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
				<Button color="alternative" on:click={() => showViewUserModal = false}>
					Close
				</Button>
				<Button color="primary" on:click={() => { showViewUserModal = false; openEditUserModal(selectedUser); }}>
					<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
					</svg>
					Edit User
				</Button>
			</div>
		</div>
	{/if}
</Modal>

<!-- Delete User Modal -->
<Modal bind:open={showDeleteUserModal} size="md" autoclose={false}>
	{#if selectedUser}
		<div class="p-6 space-y-6">
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0 w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
				</div>
				
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Delete User</h3>
					<p class="text-slate-600 dark:text-slate-400 mt-2">
						Are you sure you want to delete <strong class="text-slate-900 dark:text-white">"{getUserFullName(selectedUser)}"</strong>? 
						This action cannot be undone and will remove their access to the system.
					</p>
					
					<div class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
						<div class="flex items-center gap-2 text-red-700 dark:text-red-400">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
							</svg>
							<span class="text-sm font-medium">Warning: This will permanently remove the user from {getOrganizationName(selectedUser.organizationId)}.</span>
						</div>
					</div>
				</div>
			</div>
			
			<div class="flex justify-end gap-3">
				<Button color="alternative" on:click={() => showDeleteUserModal = false} disabled={isDeleting}>
					Cancel
				</Button>
				<Button color="red" on:click={handleDeleteUser} disabled={isDeleting}>
					{#if isDeleting}
						<Spinner size="4" class="mr-2" />
						Deleting...
					{:else}
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
						Delete User
					{/if}
				</Button>
			</div>
		</div>
	{/if}
</Modal>

<!-- Reset Password Modal -->
<Modal bind:open={showResetPasswordModal} size="md" autoclose={false}>
	{#if selectedUser}
		<div class="p-6 space-y-6">
			<div class="flex items-start gap-4">
				<div class="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</div>
				
				<div class="flex-1">
					<h3 class="text-lg font-semibold text-slate-900 dark:text-white">Reset Password</h3>
					<p class="text-slate-600 dark:text-slate-400 mt-2">
						Send a password reset email to <strong class="text-slate-900 dark:text-white">"{getUserFullName(selectedUser)}"</strong>? 
						They will receive an email with instructions to set a new password.
					</p>
					
					<div class="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
						<div class="flex items-center gap-2 text-blue-700 dark:text-blue-400">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
							</svg>
							<span class="text-sm font-medium">The reset email will be sent to: {selectedUser.email}</span>
						</div>
					</div>
				</div>
			</div>
			
			<div class="flex justify-end gap-3">
				<Button color="alternative" on:click={() => showResetPasswordModal = false} disabled={isResettingPassword}>
					Cancel
				</Button>
				<Button color="primary" on:click={() => handleResetPassword(selectedUser)} disabled={isResettingPassword}>
					{#if isResettingPassword}
						<Spinner size="4" class="mr-2" />
						Sending...
					{:else}
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						Send Reset Email
					{/if}
				</Button>
			</div>
		</div>
	{/if}
</Modal>