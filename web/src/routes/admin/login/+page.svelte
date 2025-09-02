<script>
	import { Card, Button, Input, Label, Alert, Checkbox } from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { toastStore } from '$lib/stores/toast';
	import { authAPI } from '$lib/api/auth';

	let email = '';
	let password = '';
	let rememberMe = false;
	let loading = false;
	let error = '';

	// Form validation errors
	let fieldErrors = {
		email: '',
		password: ''
	};

	onMount(() => {
		// Check if user is already authenticated
		const unsubscribe = authStore.subscribe(auth => {
			if (auth.isAuthenticated && auth.userType === 'admin') {
				const redirectTo = $page.url.searchParams.get('redirectTo') || '/admin';
			goto(redirectTo);
			}
		});

		return unsubscribe;
	});

	function validateForm() {
		fieldErrors = { email: '', password: '' };
		let isValid = true;

		// Email validation
		if (!email.trim()) {
			fieldErrors.email = 'Email is required';
			isValid = false;
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			fieldErrors.email = 'Please enter a valid email address';
			isValid = false;
		}

		// Password validation
		if (!password) {
			fieldErrors.password = 'Password is required';
			isValid = false;
		} else if (password.length < 6) {
			fieldErrors.password = 'Password must be at least 6 characters long';
			isValid = false;
		}

		return isValid;
	}

	async function handleLogin() {
		if (!validateForm()) {
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await authAPI.loginAdmin(email.trim(), password, rememberMe);
			
			// Store auth data
			authStore.login(
				{ 
					accessToken: response.data.accessToken, 
					refreshToken: response.data.refreshToken 
				}, 
				response.data.user, 
				'admin'
			);

			// Show success toast
			toastStore.success('Welcome back! You have been successfully logged in to the admin dashboard.');

			// Redirect to admin dashboard
			const redirectTo = $page.url.searchParams.get('redirectTo') || '/admin';
			goto(redirectTo);

		} catch (err) {
			console.error('Admin login error:', err);
			
			// Handle specific error cases
			if (err.status === 401) {
				if (err.data?.error?.includes('locked')) {
					error = 'Your admin account has been locked due to too many failed login attempts. Please contact system administrator.';
				} else if (err.data?.error?.includes('invalid')) {
					error = 'Invalid admin credentials. Please verify your email and password.';
				} else {
					error = 'Authentication failed. Please check your admin credentials.';
				}
			} else if (err.status === 423) {
				const lockoutTime = err.data?.lockoutExpiresAt ? 
					new Date(err.data.lockoutExpiresAt).toLocaleTimeString() : 'later';
				error = `Admin account temporarily locked. Try again after ${lockoutTime}.`;
				toastStore.warning('Admin account locked for security', '', { timeout: 10000 });
			} else if (err.status === 429) {
				error = 'Too many login attempts. Please wait a few minutes before trying again.';
			} else if (err.status === 403) {
				error = 'Access denied. This account does not have admin privileges.';
				toastStore.error('Admin access required');
			} else if (err.status >= 500) {
				error = 'Admin authentication service is temporarily unavailable.';
				toastStore.error('Admin login service unavailable');
			} else if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
				error = 'Network error. Please check your internet connection.';
			} else {
				error = err.data?.error || 'An unexpected error occurred. Please try again.';
			}
		} finally {
			loading = false;
		}
	}

	function goToForgotPassword() {
		goto('/forgot-password?type=admin');
	}

	function goToClientLogin() {
		goto('/login');
	}

	function goHome() {
		goto('/');
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter' && !loading) {
			handleLogin();
		}
	}
</script>

<svelte:head>
	<title>Admin Login - NOURX</title>
	<meta name="description" content="Sign in to the NOURX admin dashboard to manage clients and projects" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="text-center mb-8">
			<button on:click={goHome} class="text-3xl font-bold text-slate-900 dark:text-slate-50 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
				NOURX
			</button>
			<div class="flex items-center justify-center mt-2 space-x-2">
				<svg class="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
				</svg>
				<p class="text-slate-600 dark:text-slate-400">Admin Dashboard</p>
			</div>
		</div>

		<!-- Login Form -->
		<Card class="p-8 border-2 border-slate-200 dark:border-slate-700">
			{#if error}
				<Alert color="red" class="mb-6">
					<span class="font-medium">Error:</span> {error}
				</Alert>
			{/if}

			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				<!-- Email Field -->
				<div>
					<Label for="admin-email" class="mb-2">Admin Email</Label>
					<Input
						id="admin-email"
						type="email"
						placeholder="admin@nourx.com"
						bind:value={email}
						required
						disabled={loading}
						class="focus-ring {fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}"
						on:keypress={handleKeyPress}
						autocomplete="email"
					/>
					{#if fieldErrors.email}
						<p class="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.email}</p>
					{/if}
				</div>

				<!-- Password Field -->
				<div>
					<Label for="admin-password" class="mb-2">Password</Label>
					<Input
						id="admin-password"
						type="password"
						placeholder="Enter your admin password"
						bind:value={password}
						required
						disabled={loading}
						class="focus-ring {fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}"
						on:keypress={handleKeyPress}
						autocomplete="current-password"
					/>
					{#if fieldErrors.password}
						<p class="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.password}</p>
					{/if}
				</div>

				<!-- Remember Me -->
				<div class="flex items-center justify-between">
					<Checkbox bind:checked={rememberMe} disabled={loading}>
						Keep me signed in
					</Checkbox>
					<button
						type="button"
						on:click={goToForgotPassword}
						class="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
						disabled={loading}
					>
						Forgot password?
					</button>
				</div>

				<!-- Submit Button -->
				<Button
					type="submit"
					class="w-full"
					size="lg"
					disabled={loading || !email.trim() || !password}
					color="dark"
				>
					{#if loading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Signing in...
					{:else}
						Access Admin Dashboard
					{/if}
				</Button>
			</form>

			<!-- Additional Links -->
			<div class="mt-6 text-center">
				<div class="border-t border-slate-200 dark:border-slate-700 pt-4">
					<p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
						Looking for client access?
					</p>
					<Button
						on:click={goToClientLogin}
						color="alternative"
						size="sm"
						disabled={loading}
					>
						Client Login
					</Button>
				</div>
			</div>
		</Card>

		<!-- Security Notice -->
		<div class="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
			<div class="flex items-start space-x-3">
				<svg class="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
				<div>
					<p class="text-sm font-medium text-slate-900 dark:text-slate-100">Secure Access</p>
					<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
						This is a restricted area for NOURX team members only. All access is monitored and logged.
					</p>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div class="text-center mt-8">
			<p class="text-xs text-slate-500 dark:text-slate-400">
				© 2024 NOURX. All rights reserved.
			</p>
		</div>
	</div>
</div>

<style>
	.focus-ring:focus {
		@apply ring-2 ring-blue-200 dark:ring-blue-800 border-blue-500 dark:border-blue-400;
	}
</style>
