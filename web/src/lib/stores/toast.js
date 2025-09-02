// @ts-nocheck
import { writable } from 'svelte/store';

function createToastStore() {
	const { subscribe, set, update } = writable([]);

	let toastId = 0;

	return {
		subscribe,
		add: (toast) => {
			const id = toastId++;
			const newToast = {
				id,
				type: 'info',
				title: '',
				message: '',
				timeout: 5000,
				dismissible: true,
				...toast
			};

			update(toasts => [...toasts, newToast]);
			return id;
		},
		remove: (id) => {
			update(toasts => toasts.filter(toast => toast.id !== id));
		},
		clear: () => {
			set([]);
		},
		// Convenience methods
		success: (message, title = '', options = {}) => {
			const id = toastId++;
			const newToast = {
				id,
				type: 'success',
				title,
				message,
				timeout: 5000,
				dismissible: true,
				...options
			};
			update(toasts => [...toasts, newToast]);
			return id;
		},
		error: (message, title = '', options = {}) => {
			const id = toastId++;
			const newToast = {
				id,
				type: 'error',
				title,
				message,
				timeout: 0,
				dismissible: true,
				...options
			};
			update(toasts => [...toasts, newToast]);
			return id;
		},
		warning: (message, title = '', options = {}) => {
			const id = toastId++;
			const newToast = {
				id,
				type: 'warning',
				title,
				message,
				timeout: 5000,
				dismissible: true,
				...options
			};
			update(toasts => [...toasts, newToast]);
			return id;
		},
		info: (message, title = '', options = {}) => {
			const id = toastId++;
			const newToast = {
				id,
				type: 'info',
				title,
				message,
				timeout: 5000,
				dismissible: true,
				...options
			};
			update(toasts => [...toasts, newToast]);
			return id;
		}
	};
}

export const toastStore = createToastStore();
