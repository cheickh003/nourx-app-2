// @ts-nocheck
import { apiClient } from './client';

/**
 * API client for managing organizations and user accounts
 */
export const accountsApi = {
  // Organizations API
  organizations: {
    /**
     * Get all organizations with pagination and search
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number (default: 1)
     * @param {number} params.limit - Items per page (default: 10)
     * @param {string} params.search - Search term
     * @param {string} params.status - Filter by status ('active', 'inactive')
     * @param {string} params.sortBy - Sort field
     * @param {string} params.sortOrder - Sort order ('asc', 'desc')
     */
    async getAll(params = {}) {
      const queryParams = new URLSearchParams();
      
      // Add pagination
      queryParams.append('page', params.page || 1);
      queryParams.append('limit', params.limit || 10);
      
      // Add search and filters
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

      const response = await apiClient.get(`/accounts/organizations?${queryParams}`);
      return response.data;
    },

    /**
     * Get organization by ID with detailed information
     * @param {number} id - Organization ID
     */
    async getById(id) {
      const response = await apiClient.get(`/accounts/organizations/${id}`);
      return response.data;
    },

    /**
     * Create new organization
     * @param {Object} organizationData - Organization data
     * @param {string} organizationData.name - Organization name
     * @param {string} organizationData.description - Description
     * @param {string} organizationData.domain - Domain
     * @param {Object} organizationData.settings - Organization settings
     */
    async create(organizationData) {
      const response = await apiClient.post('/accounts/organizations', organizationData);
      return response.data;
    },

    /**
     * Update organization
     * @param {number} id - Organization ID
     * @param {Object} updateData - Data to update
     */
    async update(id, updateData) {
      const response = await apiClient.patch(`/accounts/organizations/${id}`, updateData);
      return response.data;
    },

    /**
     * Delete organization (soft delete)
     * @param {number} id - Organization ID
     */
    async delete(id) {
      const response = await apiClient.delete(`/accounts/organizations/${id}`);
      return response.data;
    },

    /**
     * Get organization statistics
     * @param {number} id - Organization ID
     */
    async getStats(id) {
      const response = await apiClient.get(`/accounts/organizations/${id}/stats`);
      return response.data;
    },

    /**
     * Toggle organization status (active/inactive)
     * @param {number} id - Organization ID
     * @param {boolean} active - New status
     */
    async toggleStatus(id, active) {
      const response = await apiClient.patch(`/accounts/organizations/${id}/status`, { active });
      return response.data;
    }
  },

  // Users API
  users: {
    /**
     * Get users for specific organization
     * @param {number} organizationId - Organization ID
     * @param {Object} params - Query parameters
     * @param {number} params.page - Page number
     * @param {number} params.limit - Items per page
     * @param {string} params.search - Search term
     * @param {string} params.role - Filter by role
     * @param {string} params.status - Filter by status
     */
    async getByOrganization(organizationId, params = {}) {
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', params.page || 1);
      queryParams.append('limit', params.limit || 10);
      
      if (params.search) queryParams.append('search', params.search);
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);

      const response = await apiClient.get(`/accounts/organizations/${organizationId}/users?${queryParams}`);
      return response.data;
    },

    /**
     * Get all users across organizations (admin view)
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', params.page || 1);
      queryParams.append('limit', params.limit || 10);
      
      if (params.search) queryParams.append('search', params.search);
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);
      if (params.organizationId) queryParams.append('organizationId', params.organizationId);

      const response = await apiClient.get(`/accounts/users?${queryParams}`);
      return response.data;
    },

    /**
     * Get user by ID
     * @param {number} id - User ID
     */
    async getById(id) {
      const response = await apiClient.get(`/accounts/users/${id}`);
      return response.data;
    },

    /**
     * Invite new user to organization
     * @param {number} organizationId - Organization ID
     * @param {Object} inviteData - Invitation data
     * @param {string} inviteData.email - User email
     * @param {string} inviteData.role - User role ('owner', 'manager', 'reader')
     * @param {string} inviteData.firstName - First name
     * @param {string} inviteData.lastName - Last name
     */
    async invite(organizationId, inviteData) {
      const response = await apiClient.post(`/accounts/organizations/${organizationId}/users`, inviteData);
      return response.data;
    },

    /**
     * Update user information
     * @param {number} id - User ID
     * @param {Object} updateData - Data to update
     */
    async update(id, updateData) {
      const response = await apiClient.patch(`/accounts/users/${id}`, updateData);
      return response.data;
    },

    /**
     * Update user role
     * @param {number} id - User ID
     * @param {string} role - New role
     */
    async updateRole(id, role) {
      const response = await apiClient.patch(`/accounts/users/${id}/role`, { role });
      return response.data;
    },

    /**
     * Toggle user status (active/inactive)
     * @param {number} id - User ID
     * @param {boolean} active - New status
     */
    async toggleStatus(id, active) {
      const response = await apiClient.patch(`/accounts/users/${id}/status`, { active });
      return response.data;
    },

    /**
     * Reset user password
     * @param {number} id - User ID
     */
    async resetPassword(id) {
      const response = await apiClient.post(`/accounts/users/${id}/reset-password`);
      return response.data;
    },

    /**
     * Delete user (soft delete)
     * @param {number} id - User ID
     */
    async delete(id) {
      const response = await apiClient.delete(`/accounts/users/${id}`);
      return response.data;
    },

    /**
     * Resend invitation to user
     * @param {number} id - User ID
     */
    async resendInvite(id) {
      const response = await apiClient.post(`/accounts/users/${id}/resend-invite`);
      return response.data;
    }
  },

  // Admin users API
  admins: {
    /**
     * Get all admin users
     * @param {Object} params - Query parameters
     */
    async getAll(params = {}) {
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', params.page || 1);
      queryParams.append('limit', params.limit || 10);
      
      if (params.search) queryParams.append('search', params.search);
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);

      const response = await apiClient.get(`/accounts/admins?${queryParams}`);
      return response.data;
    },

    /**
     * Create new admin user
     * @param {Object} adminData - Admin user data
     */
    async create(adminData) {
      const response = await apiClient.post('/accounts/admins', adminData);
      return response.data;
    },

    /**
     * Update admin user
     * @param {number} id - Admin user ID
     * @param {Object} updateData - Data to update
     */
    async update(id, updateData) {
      const response = await apiClient.patch(`/accounts/admins/${id}`, updateData);
      return response.data;
    },

    /**
     * Toggle admin user status
     * @param {number} id - Admin user ID
     * @param {boolean} active - New status
     */
    async toggleStatus(id, active) {
      const response = await apiClient.patch(`/accounts/admins/${id}/status`, { active });
      return response.data;
    }
  }
};
