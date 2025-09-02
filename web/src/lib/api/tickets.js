// @ts-nocheck
import { apiClient } from './client';

export const ticketsAPI = {
	// Get all tickets (admin view with pagination and filters)
	getTickets: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiClient.get(`/tickets${queryString ? `?${queryString}` : ''}`);
	},

	// Get client tickets (client view)
	getClientTickets: (params = {}) => {
		const queryString = new URLSearchParams(params).toString();
		return apiClient.get(`/client/tickets${queryString ? `?${queryString}` : ''}`);
	},

	// Get ticket by ID
	getTicket: (ticketId) => {
		return apiClient.get(`/tickets/${ticketId}`);
	},

	// Create new ticket (client action)
	createTicket: (ticketData) => {
		return apiClient.post('/tickets', ticketData);
	},

	// Update ticket (admin action)
	updateTicket: (ticketId, ticketData) => {
		return apiClient.patch(`/tickets/${ticketId}`, ticketData);
	},

	// Close ticket
	closeTicket: (ticketId, notes = '') => {
		return apiClient.post(`/tickets/${ticketId}/close`, { notes });
	},

	// Reopen ticket
	reopenTicket: (ticketId) => {
		return apiClient.post(`/tickets/${ticketId}/reopen`);
	},

	// Assign ticket (admin action)
	assignTicket: (ticketId, assigneeId) => {
		return apiClient.post(`/tickets/${ticketId}/assign`, { assigneeId });
	},

	// Change priority (admin action)
	changePriority: (ticketId, priority) => {
		return apiClient.patch(`/tickets/${ticketId}/priority`, { priority });
	},

	// Get ticket messages/conversation
	getTicketMessages: (ticketId) => {
		return apiClient.get(`/tickets/${ticketId}/messages`);
	},

	// Add message to ticket
	addMessage: (ticketId, message, isInternal = false) => {
		return apiClient.post(`/tickets/${ticketId}/messages`, {
			message,
			isInternal
		});
	},

	// Upload attachment to ticket
	uploadAttachment: (ticketId, file, messageId = null) => {
		return apiClient.uploadFile(`/tickets/${ticketId}/attachments`, file, {
			messageId
		});
	},

	// Download attachment
	downloadAttachment: (ticketId, attachmentId, filename) => {
		return apiClient.downloadFile(
			`/tickets/${ticketId}/attachments/${attachmentId}`,
			filename
		);
	},

	// Get ticket statistics (admin)
	getTicketStats: () => {
		return apiClient.get('/tickets/stats');
	},

	// Get ticket categories
	getTicketCategories: () => {
		return apiClient.get('/tickets/categories');
	},

	// Create ticket category (admin)
	createTicketCategory: (categoryData) => {
		return apiClient.post('/tickets/categories', categoryData);
	},

	// Search tickets
	searchTickets: (query, filters = {}) => {
		return apiClient.get('/tickets/search', {
			...filters,
			q: query
		});
	},

	// Get SLA metrics (admin)
	getSLAMetrics: () => {
		return apiClient.get('/tickets/sla-metrics');
	},

	// Escalate ticket (admin)
	escalateTicket: (ticketId, reason) => {
		return apiClient.post(`/tickets/${ticketId}/escalate`, { reason });
	}
};