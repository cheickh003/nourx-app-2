<script>
	import { Card, Badge, Button, Timeline, TimelineItem, Modal } from 'flowbite-svelte';
	
	let projects = [
		{
			id: 1,
			name: 'Website Redesign',
			status: 'In Progress',
			progress: 65,
			startDate: '2024-06-01',
			deadline: '2024-09-30',
			description: 'Complete redesign of corporate website with modern UI/UX',
			milestones: [
				{ name: 'Discovery & Planning', status: 'Completed', date: '2024-06-15' },
				{ name: 'Design Mockups', status: 'Completed', date: '2024-07-01' },
				{ name: 'Development', status: 'In Progress', date: '2024-08-15' },
				{ name: 'Testing & Launch', status: 'Pending', date: '2024-09-20' }
			]
		},
		{
			id: 2,
			name: 'Brand Identity Package',
			status: 'Completed',
			progress: 100,
			startDate: '2024-05-01',
			deadline: '2024-07-31',
			description: 'Complete brand identity including logo, colors, and style guide',
			milestones: [
				{ name: 'Brand Research', status: 'Completed', date: '2024-05-15' },
				{ name: 'Logo Design', status: 'Completed', date: '2024-06-01' },
				{ name: 'Style Guide', status: 'Completed', date: '2024-06-15' },
				{ name: 'Final Delivery', status: 'Completed', date: '2024-07-30' }
			]
		}
	];
	
/** @type {any} */
let selectedProject = null;
	let showProjectModal = false;
	
/** @param {any} project */
function viewProject(project) {
		selectedProject = project;
		showProjectModal = true;
	}
	
/** @param {string} status */
function getStatusColor(status) {
		switch (status) {
			case 'Completed': return 'green';
			case 'In Progress': return 'blue';
			case 'Pending': return 'yellow';
			case 'On Hold': return 'red';
        default: return 'dark';
    }
}

/** @param {string} status */
function getMilestoneColor(status) {
    switch (status) {
        case 'Completed': return 'green';
        case 'In Progress': return 'blue';
        case 'Pending': return 'dark';
        default: return 'dark';
    }
}
</script>

<svelte:head>
	<title>My Projects - NOURX Client Portal</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">My Projects</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Track progress and milestones for your active projects</p>
		</div>
		<Button color="primary" size="sm">
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			Request Project
		</Button>
	</div>

	<!-- Project Stats -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Active Projects</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{projects.filter(p => p.status !== 'Completed').length}</p>
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
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Progress</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)}%</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Projects Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		{#each projects as project}
			<Card class="hover:shadow-lg transition-shadow cursor-pointer" on:click={() => viewProject(project)}>
				<div class="p-6 pb-2 flex justify-between items-start">
					<div>
						<h3 class="text-lg font-semibold text-slate-900 dark:text-slate-50">{project.name}</h3>
						<p class="text-sm text-slate-500 mt-1">{project.description}</p>
					</div>
					<Badge color={getStatusColor(project.status)}>{project.status}</Badge>
				</div>
				
				<div class="px-6 pb-6 space-y-4">
					<div>
						<div class="flex justify-between items-center mb-2">
							<span class="text-sm font-medium text-slate-600 dark:text-slate-400">Progress</span>
							<span class="text-sm text-slate-600 dark:text-slate-400">{project.progress}%</span>
						</div>
						<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
							<div class="bg-blue-600 h-2 rounded-full" style="width: {project.progress}%"></div>
						</div>
					</div>
					
					<div class="flex justify-between text-sm text-slate-600 dark:text-slate-400">
						<span>Started: {project.startDate}</span>
						<span>Deadline: {project.deadline}</span>
					</div>
					
					<div class="flex gap-2 pt-2">
						<Button color="alternative" size="xs" class="flex-1">View Details</Button>
						<Button color="alternative" size="xs">
							<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.001 8.001 0 01-7.938-7M3 4h18M3 4v6h18V4M3 20h18" />
							</svg>
						</Button>
					</div>
				</div>
			</Card>
		{/each}
	</div>
</div>

<!-- Project Details Modal -->
<Modal bind:open={showProjectModal} size="lg" class="w-full">
	{#if selectedProject}
		<div class="space-y-6">
			<div class="flex justify-between items-start">
				<div>
					<h2 class="text-xl font-bold text-slate-900 dark:text-slate-50">{selectedProject.name}</h2>
					<p class="text-slate-600 dark:text-slate-400 mt-1">{selectedProject.description}</p>
				</div>
				<Badge color={getStatusColor(selectedProject.status)} large>{selectedProject.status}</Badge>
			</div>
			
			<div>
				<div class="flex justify-between items-center mb-2">
					<span class="font-medium text-slate-900 dark:text-slate-50">Overall Progress</span>
					<span class="text-slate-600 dark:text-slate-400">{selectedProject.progress}%</span>
				</div>
				<div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
					<div class="bg-blue-600 h-3 rounded-full" style="width: {selectedProject.progress}%"></div>
				</div>
			</div>
			
			<div class="grid grid-cols-2 gap-4 text-sm">
				<div>
					<span class="font-medium text-slate-600 dark:text-slate-400">Start Date:</span>
					<p class="text-slate-900 dark:text-slate-50">{selectedProject.startDate}</p>
				</div>
				<div>
					<span class="font-medium text-slate-600 dark:text-slate-400">Deadline:</span>
					<p class="text-slate-900 dark:text-slate-50">{selectedProject.deadline}</p>
				</div>
			</div>
			
			<div>
				<h3 class="font-semibold text-slate-900 dark:text-slate-50 mb-4">Project Milestones</h3>
				<Timeline>
					{#each selectedProject.milestones as milestone}
						<TimelineItem title={milestone.name} date={milestone.date}>
							<div class="flex items-center gap-2">
                        <Badge color={getMilestoneColor(milestone.status)}>{milestone.status}</Badge>
							</div>
						</TimelineItem>
					{/each}
				</Timeline>
			</div>
			
			<div class="flex gap-2 pt-4">
				<Button color="primary">Download Deliverables</Button>
				<Button color="alternative">Request Changes</Button>
				<Button color="alternative">Contact Team</Button>
			</div>
		</div>
	{/if}
</Modal>
