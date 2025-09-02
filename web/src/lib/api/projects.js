// @ts-nocheck
import { apiClient } from './client';

export const projectsAPI = {
	// Get all projects (admin view with pagination)
	getProjects: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiClient.get(`/projects${queryString ? `?${queryString}` : ''}`);
	},

	// Get client projects (client view)
	getClientProjects: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiClient.get(`/client/projects${queryString ? `?${queryString}` : ''}`);
	},

	// Get project by ID
	getProject: (projectId) => {
		return apiClient.get(`/projects/${projectId}`);
	},

	// Create new project (admin only)
	createProject: (projectData) => {
		return apiClient.post('/projects', projectData);
	},

	// Update project
	updateProject: (projectId, projectData) => {
		return apiClient.patch(`/projects/${projectId}`, projectData);
	},

	// Delete project (admin only)
	deleteProject: (projectId) => {
		return apiClient.delete(`/projects/${projectId}`);
	},

	// Get project milestones
	getMilestones: (projectId) => {
		return apiClient.get(`/projects/${projectId}/milestones`);
	},

	// Create milestone
	createMilestone: (projectId, milestoneData) => {
		return apiClient.post(`/projects/${projectId}/milestones`, milestoneData);
	},

	// Update milestone
	updateMilestone: (projectId, milestoneId, milestoneData) => {
		return apiClient.patch(`/projects/${projectId}/milestones/${milestoneId}`, milestoneData);
	},

	// Delete milestone
	deleteMilestone: (projectId, milestoneId) => {
		return apiClient.delete(`/projects/${projectId}/milestones/${milestoneId}`);
	},

	// Get deliverables
	getDeliverables: (projectId) => {
		return apiClient.get(`/projects/${projectId}/deliverables`);
	},

	// Create deliverable
	createDeliverable: (projectId, deliverableData) => {
		return apiClient.post(`/projects/${projectId}/deliverables`, deliverableData);
	},

	// Update deliverable
	updateDeliverable: (projectId, deliverableId, deliverableData) => {
		return apiClient.patch(`/projects/${projectId}/deliverables/${deliverableId}`, deliverableData);
	},

	// Upload deliverable file
	uploadDeliverable: (projectId, deliverableId, file, additionalData = {}) => {
		return apiClient.uploadFile(
			`/projects/${projectId}/deliverables/${deliverableId}/upload`,
			file,
			additionalData
		);
	},

	// Download deliverable
	downloadDeliverable: (projectId, deliverableId, filename) => {
		return apiClient.downloadFile(
			`/projects/${projectId}/deliverables/${deliverableId}/download`,
			filename
		);
	},

	// Approve deliverable (client action)
	approveDeliverable: (projectId, deliverableId, notes = '') => {
		return apiClient.post(`/projects/${projectId}/deliverables/${deliverableId}/approve`, {
			notes
		});
	},

	// Request revision (client action)
	requestRevision: (projectId, deliverableId, notes) => {
		return apiClient.post(`/projects/${projectId}/deliverables/${deliverableId}/request-revision`, {
			notes
		});
	},

	// Get project timeline/activity
	getProjectActivity: (projectId) => {
		return apiClient.get(`/projects/${projectId}/activity`);
	},

	// Get project statistics (admin)
	getProjectStats: () => {
		return apiClient.get('/projects/stats');
	}
};