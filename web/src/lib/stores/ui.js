import { writable } from 'svelte/store';

function createUIStore() {
    /** @type {{
     *  sidebarOpen: boolean;
     *  darkMode: boolean;
     *  loading: boolean;
     *  breadcrumbs: Array<{label: string; href?: string}>;
     *  pageTitle: string;
     * }} */
    const initial = {
        sidebarOpen: false,
        darkMode: false,
        loading: false,
        breadcrumbs: [],
        pageTitle: ''
    };
    const { subscribe, set, update } = writable(initial);

	return {
		subscribe,
		toggleSidebar: () => {
			update(state => ({
				...state,
				sidebarOpen: !state.sidebarOpen
			}));
		},
		/** @param {boolean} open */
		setSidebarOpen: (open) => {
			update(state => ({
				...state,
				sidebarOpen: open
			}));
		},
		/** Toggle dark mode */
		toggleDarkMode: () => {
			update(state => {
				const newDarkMode = !state.darkMode;
				// Update document class for Tailwind dark mode
				if (typeof document !== 'undefined') {
					if (newDarkMode) {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
					localStorage.setItem('darkMode', newDarkMode.toString());
				}
				return {
					...state,
					darkMode: newDarkMode
				};
			});
		},
		/** @param {boolean} darkMode */
		setDarkMode: (darkMode) => {
			update(state => {
				// Update document class for Tailwind dark mode
				if (typeof document !== 'undefined') {
					if (darkMode) {
						document.documentElement.classList.add('dark');
					} else {
						document.documentElement.classList.remove('dark');
					}
					localStorage.setItem('darkMode', darkMode.toString());
				}
				return {
					...state,
					darkMode
				};
			});
		},
		/** @param {boolean} loading */
		setLoading: (loading) => {
			update(state => ({
				...state,
				loading
			}));
		},
		/** @param {Array<{ label: string; href?: string }>} breadcrumbs */
		setBreadcrumbs: (breadcrumbs) => {
			update(state => ({
				...state,
				breadcrumbs
			}));
		},
		/** @param {string} title */
		setPageTitle: (title) => {
			update(state => ({
				...state,
				pageTitle: title
			}));
		},
		// Initialize dark mode from localStorage
		initializeDarkMode: () => {
			if (typeof localStorage !== 'undefined') {
				const savedDarkMode = localStorage.getItem('darkMode');
				if (savedDarkMode !== null) {
					const darkMode = savedDarkMode === 'true';
					update(state => {
						if (typeof document !== 'undefined') {
							if (darkMode) {
								document.documentElement.classList.add('dark');
							} else {
								document.documentElement.classList.remove('dark');
							}
						}
						return {
							...state,
							darkMode
						};
					});
				} else {
					// Default to system preference
					if (typeof window !== 'undefined' && window.matchMedia) {
						const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
						update(state => {
							if (typeof document !== 'undefined') {
								if (prefersDark) {
									document.documentElement.classList.add('dark');
								} else {
									document.documentElement.classList.remove('dark');
								}
							}
							return {
								...state,
								darkMode: prefersDark
							};
						});
					}
				}
			}
		}
	};
}

export const uiStore = createUIStore();
