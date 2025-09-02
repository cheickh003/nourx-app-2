// @ts-nocheck
import { apiClient } from './client';

export const authAPI = {
	// Client authentication
	loginClient: (email, password, rememberMe = false) => {
		return apiClient.post('/auth/login', { 
			email, 
			password, 
			userType: 'client',
			rememberMe
		}, { requiresAuth: false });
	},

	// Admin authentication  
	loginAdmin: (email, password, rememberMe = false) => {
		return apiClient.post('/auth/login', { 
			email, 
			password,
			userType: 'admin',
			rememberMe 
		}, { requiresAuth: false });
	},

	// Logout
	logout: () => {
		return apiClient.post('/auth/logout');
	},

	// Refresh token
	refreshToken: (refreshToken) => {
		return apiClient.post('/auth/refresh', { 
			refreshToken 
		}, { requiresAuth: false });
	},

	// Get current user profile
	getCurrentUser: () => {
		return apiClient.get('/auth/me');
	},

	// Update user profile
	updateProfile: (userData) => {
		return apiClient.patch('/auth/profile', userData);
	},

	// Change password
	changePassword: (currentPassword, newPassword) => {
		return apiClient.post('/auth/change-password', {
			currentPassword,
			newPassword
		});
	},

	// Forgot password
	forgotPassword: (email, userType = 'client') => {
		return apiClient.post('/auth/forgot-password', { 
			email,
			userType 
		}, { requiresAuth: false });
	},

	// Reset password
	resetPassword: (token, newPassword, userType = 'client') => {
		return apiClient.post('/auth/reset-password', {
			token,
			password: newPassword,
			userType
		}, { requiresAuth: false });
	},

	// Activate account
	activateAccount: (token, password) => {
		return apiClient.post('/auth/activate', {
			token,
			password
		}, { requiresAuth: false });
	},

	// Enable/disable 2FA
	toggle2FA: (enabled) => {
		return apiClient.post('/auth/2fa/toggle', { enabled });
	},

	// Verify 2FA code
	verify2FA: (code) => {
		return apiClient.post('/auth/2fa/verify', { code });
	}
};
