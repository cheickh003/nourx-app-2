// @ts-nocheck
import { apiClient } from './client';

export const documentsAPI = {
	// Get all documents (admin view with pagination)
	getDocuments: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiClient.get(`/documents${queryString ? `?${queryString}` : ''}`);
	},

	// Get client documents (client view)
	getClientDocuments: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiClient.get(`/client/documents${queryString ? `?${queryString}` : ''}`);
	},

	// Get document by ID
	getDocument: (documentId) => {
		return apiClient.get(`/documents/${documentId}`);
	},

	// Upload document
	uploadDocument: (file, metadata = {}) => {
		return apiClient.uploadFile('/documents', file, metadata);
	},

	// Update document metadata
	updateDocument: (documentId, documentData) => {
		return apiClient.patch(`/documents/${documentId}`, documentData);
	},

	// Delete document
	deleteDocument: (documentId) => {
		return apiClient.delete(`/documents/${documentId}`);
	},

	// Download document
	downloadDocument: (documentId, filename) => {
		return apiClient.downloadFile(`/documents/${documentId}/download`, filename);
	},

	// Get document preview/thumbnail
	getDocumentPreview: (documentId) => {
		return apiClient.get(`/documents/${documentId}/preview`);
	},

	// Share document (generate share link)
	shareDocument: (documentId, shareOptions = {}) => {
		return apiClient.post(`/documents/${documentId}/share`, shareOptions);
	},

	// Get shared document (public access)
	getSharedDocument: (shareToken) => {
		return apiClient.get(`/documents/shared/${shareToken}`, {
			requiresAuth: false
		});
	},

	// Get document versions
	getDocumentVersions: (documentId) => {
		return apiClient.get(`/documents/${documentId}/versions`);
	},

	// Upload new version of document
	uploadDocumentVersion: (documentId, file, versionNotes = '') => {
		return apiClient.uploadFile(`/documents/${documentId}/versions`, file, {
			notes: versionNotes
		});
	},

	// Restore document version
	restoreDocumentVersion: (documentId, versionId) => {
		return apiClient.post(`/documents/${documentId}/versions/${versionId}/restore`);
	},

	// Get documents by project
	getProjectDocuments: (projectId, params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiClient.get(`/projects/${projectId}/documents${queryString ? `?${queryString}` : ''}`);
	},

	// Move document to project
	moveDocumentToProject: (documentId, projectId) => {
		return apiClient.patch(`/documents/${documentId}/project`, { projectId });
	},

	// Get document categories
	getDocumentCategories: () => {
		return apiClient.get('/documents/categories');
	},

	// Create document category (admin)
	createDocumentCategory: (categoryData) => {
		return apiClient.post('/documents/categories', categoryData);
	},

	// Update document category (admin)
	updateDocumentCategory: (categoryId, categoryData) => {
		return apiClient.patch(`/documents/categories/${categoryId}`, categoryData);
	},

	// Delete document category (admin)
	deleteDocumentCategory: (categoryId) => {
		return apiClient.delete(`/documents/categories/${categoryId}`);
	},

	// Search documents
	searchDocuments: (query, filters = {}) => {
		return apiClient.get('/documents/search', {
			...filters,
			q: query
		});
	},

	// Get document statistics (admin)
	getDocumentStats: () => {
		return apiClient.get('/documents/stats');
	},

	// Bulk upload documents
	bulkUploadDocuments: (files, commonMetadata = {}) => {
		const formData = new FormData();
		files.forEach((file, index) => {
			formData.append(`files`, file);
		});
		
		Object.entries(commonMetadata).forEach(([key, value]) => {
			formData.append(key, value);
		});

		return apiClient.request('/documents/bulk-upload', {
			method: 'POST',
			body: formData,
			headers: {} // Let browser set Content-Type for FormData
		});
	},

	// Get storage usage
	getStorageUsage: () => {
		return apiClient.get('/documents/storage-usage');
	},

	// Set document permissions
	setDocumentPermissions: (documentId, permissions) => {
		return apiClient.patch(`/documents/${documentId}/permissions`, permissions);
	}
};