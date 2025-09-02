<script>
	import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Button, Search, Pagination, Tabs, TabItem, Fileupload } from 'flowbite-svelte';
	
	let documents = [
		{ 
			id: 'DOC-001', 
			name: 'Project Requirements - Acme Corp.pdf',
			type: 'PDF',
			size: '2.4 MB',
			client: 'Acme Corp',
			project: 'Website Redesign',
			uploadedBy: 'admin@nourx.com',
			uploadDate: '2024-08-20',
			category: 'Requirements'
		},
		{ 
			id: 'DOC-002', 
			name: 'Contract - TechStart Inc.docx',
			type: 'DOCX',
			size: '156 KB',
			client: 'TechStart Inc',
			project: 'Mobile App Development',
			uploadedBy: 'legal@nourx.com',
			uploadDate: '2024-08-18',
			category: 'Contracts'
		},
		{ 
			id: 'DOC-003', 
			name: 'Final Deliverable - API Integration.zip',
			type: 'ZIP',
			size: '45.2 MB',
			client: 'Global Solutions',
			project: 'API Integration',
			uploadedBy: 'dev@nourx.com',
			uploadDate: '2024-08-15',
			category: 'Deliverables'
		}
	];
	
	let searchTerm = '';
	let categoryFilter = 'all';
	/** @type {FileList | undefined} */
	let selectedFiles;
	
	/** @param {string} type */
	function getTypeColor(type) {
		switch (type.toLowerCase()) {
			case 'pdf': return 'red';
			case 'docx': case 'doc': return 'blue';
			case 'xlsx': case 'xls': return 'green';
			case 'zip': case 'rar': return 'yellow';
			case 'jpg': case 'png': case 'gif': return 'purple';
			default: return 'dark';
		}
	}
	
	/** @param {number} bytes */
	function formatFileSize(bytes) {
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
	}
	
	$: filteredDocuments = documents.filter(doc => {
		const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			doc.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
			doc.project.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
		return matchesSearch && matchesCategory;
	});
</script>

<svelte:head>
	<title>Documents - NOURX Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Document Management</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Manage project documents, contracts and deliverables</p>
		</div>
		<Button color="primary" size="sm">
			<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
			</svg>
			Upload Files
		</Button>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
					<svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Total Documents</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{documents.length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
					<svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Deliverables</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{documents.filter(d => d.category === 'Deliverables').length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
					<svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Contracts</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{documents.filter(d => d.category === 'Contracts').length}</p>
				</div>
			</div>
		</Card>
		
		<Card class="p-4">
			<div class="flex items-center">
				<div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
					<svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-slate-600 dark:text-slate-400">Requirements</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">{documents.filter(d => d.category === 'Requirements').length}</p>
				</div>
			</div>
		</Card>
	</div>

	<!-- Upload Section -->
	<Card class="p-6">
		<h3 class="text-lg font-semibold mb-4">Upload New Documents</h3>
		<div class="space-y-4">
			<Fileupload 
				bind:files={selectedFiles}
				class="mb-4"
			/>
			{#if selectedFiles && selectedFiles.length > 0}
				<div class="text-sm text-slate-600 dark:text-slate-400">
					{selectedFiles.length} file(s) selected
				</div>
				<Button color="primary" size="sm">Upload Documents</Button>
			{/if}
		</div>
	</Card>

	<!-- Filters -->
	<Card class="p-4">
		<div class="flex flex-col sm:flex-row gap-4 items-center">
			<Search bind:value={searchTerm} placeholder="Search documents..." class="w-full sm:w-64" />
			<select bind:value={categoryFilter} class="w-full sm:w-40 p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
				<option value="all">All Categories</option>
				<option value="Requirements">Requirements</option>
				<option value="Contracts">Contracts</option>
				<option value="Deliverables">Deliverables</option>
			</select>
		</div>
	</Card>

	<!-- Documents Table -->
	<Card>
		<div class="p-6 pb-2">
			<h2 class="text-lg font-semibold">Document Library</h2>
		</div>
		
		<Table hoverable>
			<TableHead>
				<TableHeadCell>Document</TableHeadCell>
				<TableHeadCell>Type</TableHeadCell>
				<TableHeadCell>Client</TableHeadCell>
				<TableHeadCell>Project</TableHeadCell>
				<TableHeadCell>Category</TableHeadCell>
				<TableHeadCell>Uploaded</TableHeadCell>
				<TableHeadCell>Actions</TableHeadCell>
			</TableHead>
			<TableBody>
				{#each filteredDocuments as doc}
					<TableBodyRow>
						<TableBodyCell>
							<div class="flex items-center gap-3">
								<div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
									<svg class="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
								</div>
								<div>
									<div class="font-medium text-slate-900 dark:text-slate-50">{doc.name}</div>
									<div class="text-sm text-slate-500">{doc.size} • {doc.id}</div>
								</div>
							</div>
						</TableBodyCell>
						<TableBodyCell>
							<Badge color={getTypeColor(doc.type)}>{doc.type}</Badge>
						</TableBodyCell>
						<TableBodyCell class="text-slate-600 dark:text-slate-400">{doc.client}</TableBodyCell>
						<TableBodyCell class="text-slate-600 dark:text-slate-400">{doc.project}</TableBodyCell>
						<TableBodyCell>
							<Badge color="dark">{doc.category}</Badge>
						</TableBodyCell>
						<TableBodyCell>
							<div class="text-slate-600 dark:text-slate-400">
								<div>{doc.uploadDate}</div>
								<div class="text-sm text-slate-500">by {doc.uploadedBy}</div>
							</div>
						</TableBodyCell>
						<TableBodyCell>
							<div class="flex gap-2">
								<Button color="alternative" size="xs">Download</Button>
								<Button color="alternative" size="xs">Share</Button>
								<Button color="red" size="xs">Delete</Button>
							</div>
						</TableBodyCell>
					</TableBodyRow>
				{/each}
			</TableBody>
		</Table>
	</Card>
</div>
