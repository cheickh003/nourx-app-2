// @ts-nocheck
import { authStore } from '$lib/stores/auth';
import { toastStore } from '$lib/stores/toast';
import { get } from 'svelte/store';

const API_BASE_URL = '/api';

class APIClient {
	constructor() {
		this.baseURL = API_BASE_URL;
	}

	async request(endpoint, options = {}) {
		const {
			method = 'GET',
			body,
			headers = {},
			requiresAuth = true,
			...fetchOptions
		} = options;

		const url = `${this.baseURL}${endpoint}`;
		
		// Prepare headers
		const requestHeaders = {
			'Content-Type': 'application/json',
			...headers
		};

		// Add authorization header if required and available
		if (requiresAuth) {
			const auth = get(authStore);
			if (auth.accessToken) {
				requestHeaders.Authorization = `Bearer ${auth.accessToken}`;
			}
		}

		// Prepare request options
		const requestOptions = {
			method,
			headers: requestHeaders,
			...fetchOptions
		};

		// Add body for non-GET requests
		if (body && method !== 'GET') {
			requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
		}

		try {
			const response = await fetch(url, requestOptions);

			// Handle different response types
			let data;
			const contentType = response.headers.get('content-type');
			
			if (contentType && contentType.includes('application/json')) {
				data = await response.json();
			} else {
				data = await response.text();
			}

			// Handle successful responses
			if (response.ok) {
				return {
					data,
					status: response.status,
					statusText: response.statusText,
					headers: response.headers
				};
			}

			// Handle HTTP errors
			const error = new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
			error.status = response.status;
			error.statusText = response.statusText;
			error.data = data;

			// Handle specific error cases
			if (response.status === 401) {
				// Unauthorized - potentially expired token
				if (requiresAuth) {
					await this.handleUnauthorized();
				}
			} else if (response.status === 403) {
				// Forbidden
				toastStore.error('You do not have permission to perform this action.');
			} else if (response.status >= 500) {
				// Server error
				toastStore.error('Server error. Please try again later.');
			}

			throw error;
		} catch (fetchError) {
			// Handle network errors
			if (fetchError.name === 'TypeError' || fetchError.message === 'Failed to fetch') {
				toastStore.error('Network error. Please check your connection.');
			} else if (!fetchError.status) {
				toastStore.error('An unexpected error occurred.');
			}
			
			throw fetchError;
		}
	}

	async handleUnauthorized() {
		const auth = get(authStore);
		
		// Try to refresh the token if we have a refresh token
		if (auth.refreshToken) {
			try {
				const response = await this.request('/auth/refresh', {
					method: 'POST',
					body: { refreshToken: auth.refreshToken },
					requiresAuth: false
				});

				// Update tokens in store
				authStore.refreshTokens(response.data);
				return;
			} catch (refreshError) {
				console.error('Token refresh failed:', refreshError);
			}
		}

		// If refresh fails or no refresh token, log out
		authStore.logout();
		toastStore.error('Your session has expired. Please log in again.');
		
		// Redirect to login based on user type
		const userType = auth.userType;
		if (typeof window !== 'undefined') {
			window.location.href = userType === 'admin' ? '/admin/login' : '/login';
		}
	}

	// Convenience methods for common HTTP verbs
	get(endpoint, options = {}) {
		return this.request(endpoint, { ...options, method: 'GET' });
	}

	post(endpoint, body, options = {}) {
		return this.request(endpoint, { ...options, method: 'POST', body });
	}

	put(endpoint, body, options = {}) {
		return this.request(endpoint, { ...options, method: 'PUT', body });
	}

	patch(endpoint, body, options = {}) {
		return this.request(endpoint, { ...options, method: 'PATCH', body });
	}

	delete(endpoint, options = {}) {
		return this.request(endpoint, { ...options, method: 'DELETE' });
	}

	// File upload helper
	async uploadFile(endpoint, file, additionalData = {}, options = {}) {
		const formData = new FormData();
		formData.append('file', file);
		
		// Add additional data to form
		Object.entries(additionalData).forEach(([key, value]) => {
			formData.append(key, value);
		});

		return this.request(endpoint, {
			...options,
			method: 'POST',
			body: formData,
			headers: {
				// Don't set Content-Type for FormData, let the browser set it
				...options.headers
			}
		});
	}

	// Download helper
	async downloadFile(endpoint, filename, options = {}) {
		try {
			const response = await this.request(endpoint, {
				...options,
				method: 'GET'
			});

			// Create a blob from the response
			const blob = new Blob([response.data]);
			const url = window.URL.createObjectURL(blob);
			
			// Create a temporary link to trigger download
			const link = document.createElement('a');
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			// Clean up the object URL
			window.URL.revokeObjectURL(url);
			
			return response;
		} catch (error) {
			toastStore.error('Failed to download file.');
			throw error;
		}
	}
}

// Create a singleton instance
export const apiClient = new APIClient();

// Export specific API modules
export * from './auth';
export * from './projects';
export * from './tickets';
export * from './documents';export * from './accounts';export * from './accounts';
