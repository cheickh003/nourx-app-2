<script>
	import { Card, Badge, Button, Search, Tabs, TabItem, Fileupload } from 'flowbite-svelte';
	
	let documents = [
		{
			id: 'DOC-001',
			name: 'Project Requirements.pdf',
			type: 'PDF',
			size: '2.4 MB',
			category: 'Requirements',
			project: 'Website Redesign',
			uploadDate: '2024-08-20',
			uploadedBy: 'Project Manager',
			description: 'Detailed requirements document for the website redesign project'
		},
		{
			id: 'DOC-002',
			name: 'Final Wireframes.sketch',
			type: 'SKETCH',
			size: '15.8 MB',
			category: 'Design',
			project: 'Website Redesign',
			uploadDate: '2024-08-22',
			uploadedBy: 'UI/UX Designer',
			description: 'Complete wireframes for all website pages'
		},
		{
			id: 'DOC-003',
			name: 'Brand Guidelines.pdf',
			type: 'PDF',
			size: '8.2 MB',
			category: 'Brand Assets',
			project: 'Brand Identity',
			uploadDate: '2024-07-30',
			uploadedBy: 'Brand Designer',
			description: 'Comprehensive brand guidelines including logo usage, colors, and typography'
		},
		{
			id: 'DOC-004',
			name: 'Logo Package.zip',
			type: 'ZIP',
			size: '45.6 MB',
			category: 'Brand Assets',
			project: 'Brand Identity',
			uploadDate: '2024-07-30',
			uploadedBy: 'Brand Designer',
			description: 'Complete logo package with all variations and formats'
		},
		{
			id: 'DOC-005',
			name: 'Website Prototype.fig',
			type: 'FIGMA',
			size: '12.3 MB',
			category: 'Design',
			project: 'Website Redesign',
			uploadDate: '2024-08-25',
			uploadedBy: 'UI/UX Designer',
			description: 'Interactive prototype of the new website design'
		}
	];
	
	let searchTerm = '';
/** @type {FileList | null} */
let selectedFiles = null;
	let uploadModalOpen = false;
	
/** @param {any} doc */
function downloadDocument(doc) {
		// TODO: Implement download functionality
		alert(`Downloading ${doc.name}`);
	}
	
/** @param {any} doc */
function shareDocument(doc) {
		// TODO: Implement share functionality
		alert(`Sharing ${doc.name}`);
	}
	
/** @param {string} type */
function getTypeColor(type) {
    switch (type.toLowerCase()) {
        case 'pdf': return 'red';
        case 'sketch': case 'figma': return 'purple';
        case 'zip': case 'rar': return 'yellow';
        case 'docx': case 'doc': return 'blue';
        case 'xlsx': case 'xls': return 'green';
        case 'jpg': case 'png': case 'gif': return 'pink';
        default: return 'dark';
    }
}
	
/** @param {string} category */
function getCategoryColor(category) {
    switch (category) {
        case 'Requirements': return 'blue';
        case 'Design': return 'purple';
        case 'Brand Assets': return 'green';
        case 'Contracts': return 'yellow';
        case 'Deliverables': return 'red';
        default: return 'dark';
    }
}
	
	$: filteredDocuments = documents.filter(doc => {
		return doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			doc.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
			doc.project.toLowerCase().includes(searchTerm.toLowerCase());
	});
	
	$: documentsByCategory = {
		'Requirements': documents.filter(d => d.category === 'Requirements'),
		'Design': documents.filter(d => d.category === 'Design'),
		'Brand Assets': documents.filter(d => d.category === 'Brand Assets'),
		'Contracts': documents.filter(d => d.category === 'Contracts'),
		'Deliverables': documents.filter(d => d.category === 'Deliverables')
	};
</script>

<svelte:head>
	<title>Documents - NOURX Client Portal</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Documents</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Access project documents, deliverables, and shared files</p>
		</div>
		<Button color="primary" size="sm" on:click={() => uploadModalOpen = true}>
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
			</svg>
			Upload Files
		</Button>
	</div>

	<!-- Document Stats -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Files</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{documents.length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
					<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4M13 13h3a2 2 0 012 2v1M19 17V9.343a2 2 0 00-.586-1.414l-2.828-2.829a2 2 0 00-2.828 0L9 9.343V17h10z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Design Files</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{documentsByCategory['Design'].length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
					<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Brand Assets</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{documentsByCategory['Brand Assets'].length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
					<svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Storage Used</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">84.3 MB</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Search -->
	<Card class="p-4">
		<Search bind:value={searchTerm} placeholder="Search documents..." class="w-full sm:w-64" />
	</Card>

	<!-- Documents Tabs -->
	<Tabs>
		<TabItem open title="All Documents">
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each filteredDocuments as doc}
					<Card class="hover:shadow-lg transition-shadow">
						<div class="p-4">
							<div class="flex items-start gap-3 mb-3">
								<div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
									<svg class="w-6 h-6 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div class="flex-1 min-w-0">
									<h3 class="font-medium text-slate-900 dark:text-slate-50 truncate">{doc.name}</h3>
									<p class="text-sm text-slate-500 mt-1">{doc.size}</p>
								</div>
								<Badge color={getTypeColor(doc.type)}>{doc.type}</Badge>
							</div>
							
							<p class="text-sm text-slate-600 dark:text-slate-400 mb-3">{doc.description}</p>
							
							<div class="space-y-2 mb-4">
								<div class="flex justify-between text-sm">
									<span class="text-slate-500">Project:</span>
									<span class="text-slate-900 dark:text-slate-50">{doc.project}</span>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-slate-500">Category:</span>
									<Badge color={getCategoryColor(doc.category)}>{doc.category}</Badge>
								</div>
								<div class="flex justify-between text-sm">
									<span class="text-slate-500">Uploaded:</span>
									<span class="text-slate-600 dark:text-slate-400">{doc.uploadDate}</span>
								</div>
							</div>
							
							<div class="flex gap-2">
								<Button color="primary" size="xs" class="flex-1" on:click={() => downloadDocument(doc)}>
									<svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									Download
								</Button>
								<Button color="alternative" size="xs" on:click={() => shareDocument(doc)}>
									<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
									</svg>
								</Button>
							</div>
						</div>
					</Card>
				{/each}
			</div>
		</TabItem>

		<TabItem title="By Category">
			<div class="space-y-6">
				{#each Object.entries(documentsByCategory) as [category, categoryDocs]}
					{#if categoryDocs.length > 0}
						<div>
							<h3 class="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
								<Badge color={getCategoryColor(category)}>{category}</Badge>
								<span class="text-sm text-slate-500">({categoryDocs.length} files)</span>
							</h3>
							<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
								{#each categoryDocs as doc}
									<div class="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
										<div class="p-1 rounded bg-slate-100 dark:bg-slate-800">
											<svg class="w-4 h-4 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
											</svg>
										</div>
										<div class="flex-1 min-w-0">
											<p class="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">{doc.name}</p>
											<p class="text-xs text-slate-500">{doc.size}</p>
										</div>
										<Button color="alternative" size="xs" on:click={() => downloadDocument(doc)}>
											<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3" />
											</svg>
										</Button>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</TabItem>

		<TabItem title="Recent">
			<div class="space-y-3">
				{#each documents.slice(0, 5) as doc}
					<div class="flex items-center gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
						<div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
							<svg class="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
							</svg>
						</div>
						<div class="flex-1">
							<h4 class="font-medium text-slate-900 dark:text-slate-50">{doc.name}</h4>
							<p class="text-sm text-slate-500">
								{doc.project} • {doc.size} • {doc.uploadDate} by {doc.uploadedBy}
							</p>
						</div>
						<div class="flex gap-2">
                            <Badge color={getCategoryColor(doc.category)}>{doc.category}</Badge>
							<Button color="alternative" size="xs" on:click={() => downloadDocument(doc)}>Download</Button>
						</div>
					</div>
				{/each}
			</div>
		</TabItem>
	</Tabs>
</div>
