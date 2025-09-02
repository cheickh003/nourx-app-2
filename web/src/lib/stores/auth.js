// @ts-nocheck
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createAuthStore() {
	const { subscribe, set, update } = writable({
		user: null,
		accessToken: null,
		refreshToken: null,
		userType: null, // 'admin' or 'client'
		isAuthenticated: false,
		isLoading: true
	});

	// Initialize from localStorage if in browser
	if (browser) {
		const accessToken = localStorage.getItem('accessToken');
		const refreshToken = localStorage.getItem('refreshToken');
		const userType = localStorage.getItem('userType');
		const userData = localStorage.getItem('userData');

		if (accessToken && userType) {
			set({
				user: userData ? JSON.parse(userData) : null,
				accessToken,
				refreshToken,
				userType,
				isAuthenticated: true,
				isLoading: false
			});
		} else {
			set({
				user: null,
				accessToken: null,
				refreshToken: null,
				userType: null,
				isAuthenticated: false,
				isLoading: false
			});
		}
	}

	return {
		subscribe,
		login: (tokens, user, userType) => {
			if (browser) {
				localStorage.setItem('accessToken', tokens.accessToken);
				localStorage.setItem('userType', userType);
				localStorage.setItem('userData', JSON.stringify(user));
				
				if (tokens.refreshToken) {
					localStorage.setItem('refreshToken', tokens.refreshToken);
				}
			}

			set({
				user,
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken || null,
				userType,
				isAuthenticated: true,
				isLoading: false
			});
		},
		logout: () => {
			if (browser) {
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
				localStorage.removeItem('userType');
				localStorage.removeItem('userData');
			}

			set({
				user: null,
				accessToken: null,
				refreshToken: null,
				userType: null,
				isAuthenticated: false,
				isLoading: false
			});
		},
		updateUser: (user) => {
			if (browser) {
				localStorage.setItem('userData', JSON.stringify(user));
			}

			update(state => ({
				...state,
				user
			}));
		},
		refreshTokens: (tokens) => {
			if (browser) {
				localStorage.setItem('accessToken', tokens.accessToken);
				if (tokens.refreshToken) {
					localStorage.setItem('refreshToken', tokens.refreshToken);
				}
			}

			update(state => ({
				...state,
				accessToken: tokens.accessToken,
				refreshToken: tokens.refreshToken || state.refreshToken
			}));
		},
		setLoading: (loading) => {
			update(state => ({
				...state,
				isLoading: loading
			}));
		}
	};
}

export const authStore = createAuthStore();