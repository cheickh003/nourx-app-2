// @ts-nocheck
import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';

export const load = async ({ url }) => {
	if (browser) {
		const accessToken = localStorage.getItem('accessToken');
		const userType = localStorage.getItem('userType');
		
		// Check if user is authenticated and has admin access
		if (!accessToken || userType !== 'admin') {
			throw redirect(302, '/admin/login?redirectTo=' + encodeURIComponent(url.pathname));
		}
	}
	
	return {};
};
