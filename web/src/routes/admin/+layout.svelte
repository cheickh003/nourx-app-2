<script>
	import { Navbar, NavBrand, NavHamburger, NavUl, NavLi, Sidebar, SidebarGroup, SidebarItem, SidebarWrapper, Drawer, Button, Breadcrumb, BreadcrumbItem } from 'flowbite-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let sidebarOpen = false;
	/** @type {{email: string; role: string} | null} */
	let user = null;

	onMount(() => {
		// Check authentication
		const token = localStorage.getItem('accessToken');
		const userType = localStorage.getItem('userType');
		
		if (!token || userType !== 'admin') {
			goto('/admin/login');
			return;
		}

		// TODO: Load user data from API in Phase 2 (Auth)
		user = {
			email: 'admin@nourx.com',
			role: 'admin'
		};
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	function logout() {
		localStorage.removeItem('accessToken');
		localStorage.removeItem('userType');
		goto('/admin/login');
	}

	$: currentPath = $page.url.pathname;

	// Build breadcrumbs from current path
	$: adminCrumbs = (() => {
		const segments = currentPath.replace(/^\/+|\/+$/g, '').split('/');
		// Ensure starts with admin
		if (!segments.length || segments[0] !== 'admin') return [];
		const items = [];
		let acc = '';
		for (let i = 0; i < segments.length; i++) {
			acc += `/${segments[i]}`;
			const label = segments[i]
				.replace(/-/g, ' ')
				.replace(/\b\w/g, (c) => c.toUpperCase());
			items.push({ href: acc, label });
		}
		return items;
	})();
</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-900">
	<!-- Top Navigation -->
	<Navbar let:hidden let:toggle class="border-b border-slate-200 dark:border-slate-700">
		<NavBrand href="/admin" class="space-x-3">
			<span class="text-2xl font-bold text-slate-900 dark:text-slate-50">NOURX</span>
			<span class="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Admin</span>
		</NavBrand>
		
		<div class="flex items-center space-x-4 md:order-2">
			<!-- User Menu -->
			{#if user}
				<div class="flex items-center space-x-3">
					<div class="text-right hidden sm:block">
						<p class="text-sm font-medium text-slate-900 dark:text-slate-50">{user.email}</p>
						<p class="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}</p>
					</div>
					<Button color="alternative" size="sm" on:click={logout}>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
						Se déconnecter
					</Button>
				</div>
			{/if}
			
			<!-- Mobile menu button -->
			<NavHamburger on:click={toggleSidebar} class="md:hidden" />
		</div>
	</Navbar>

	<div class="flex">
		<!-- Desktop Sidebar -->
		<aside class="hidden md:block w-64 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
			<SidebarWrapper class="h-full py-4">
				<SidebarGroup>
					<SidebarItem 
						label="Tableau de bord" 
						href="/admin"
						active={currentPath === '/admin'}
					>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 002-2h14a2 2 0 012 2v2" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem 
						label="Organisations" 
						href="/admin/organizations"
						active={currentPath.startsWith('/admin/organizations')}
					>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem 
						label="Comptes clients" 
						href="/admin/accounts"
						active={currentPath.startsWith('/admin/accounts')}
					>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem 
						label="Projets" 
						href="/admin/projects"
						active={currentPath.startsWith('/admin/projects')}
					>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem 
						label="Tickets de support" 
						href="/admin/tickets"
						active={currentPath.startsWith('/admin/tickets')}
					>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem 
						label="Facturation" 
						href="/admin/billing"
						active={currentPath.startsWith('/admin/billing')}
					>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem 
						label="Documents" 
						href="/admin/documents"
						active={currentPath.startsWith('/admin/documents')}
					>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem 
						label="Paramètres" 
						href="/admin/settings"
						active={currentPath.startsWith('/admin/settings')}
					>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>
				</SidebarGroup>
			</SidebarWrapper>
		</aside>

		<!-- Mobile Sidebar -->
		<Drawer
			bind:open={sidebarOpen}
			class="md:hidden"
			id="mobile-sidebar"
		>
			<SidebarWrapper class="h-full">
				<SidebarGroup>
					<!-- Same sidebar items as desktop but in drawer -->
					<SidebarItem label="Tableau de bord" href="/admin" on:click={() => sidebarOpen = false}>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 002-2h14a2 2 0 012 2v2" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem label="Organizations" href="/admin/organizations" on:click={() => sidebarOpen = false}>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem label="Client Accounts" href="/admin/accounts" on:click={() => sidebarOpen = false}>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem label="Projects" href="/admin/projects" on:click={() => sidebarOpen = false}>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem label="Support Tickets" href="/admin/tickets" on:click={() => sidebarOpen = false}>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem label="Invoicing" href="/admin/billing" on:click={() => sidebarOpen = false}>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem label="Documents" href="/admin/documents" on:click={() => sidebarOpen = false}>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>

					<SidebarItem label="Settings" href="/admin/settings" on:click={() => sidebarOpen = false}>
						<svelte:fragment slot="icon">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
						</svelte:fragment>
					</SidebarItem>
				</SidebarGroup>
			</SidebarWrapper>
		</Drawer>

		<!-- Main Content -->
		<main class="flex-1 md:ml-0 min-h-screen">
			<div class="p-6">
				<!-- Breadcrumbs -->
				{#if adminCrumbs.length}
					<Breadcrumb aria-label="Breadcrumb" class="mb-4">
						<BreadcrumbItem href="/admin" home>Admin</BreadcrumbItem>
						{#each adminCrumbs.slice(1, -1) as crumb}
							<BreadcrumbItem href={crumb.href}>{crumb.label}</BreadcrumbItem>
						{/each}
						{#if adminCrumbs.length > 1}
							<BreadcrumbItem>{adminCrumbs[adminCrumbs.length - 1].label}</BreadcrumbItem>
						{/if}
					</Breadcrumb>
				{/if}

				<slot />
			</div>
		</main>
	</div>
</div>
