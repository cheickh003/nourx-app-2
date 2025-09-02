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
			if (auth.isAuthenticated && auth.userType === 'client') {
				const redirectTo = $page.url.searchParams.get('redirectTo') || '/app';
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
			const response = await authAPI.loginClient(email.trim(), password, rememberMe);
			
			// Store auth data
			authStore.login(
				{ 
					accessToken: response.data.accessToken, 
					refreshToken: response.data.refreshToken 
				}, 
				response.data.user, 
				'client'
			);

			// Show success toast
			toastStore.success('Welcome back! You have been successfully logged in.');

			// Redirect to app
			const redirectTo = $page.url.searchParams.get('redirectTo') || '/app';
			goto(redirectTo);

		} catch (err) {
			console.error('Login error:', err);
			
			// Handle specific error cases
			if (err.status === 401) {
				if (err.data?.error?.includes('locked')) {
					error = 'Your account has been locked due to too many failed login attempts. Please try again later.';
				} else if (err.data?.error?.includes('invalid')) {
					error = 'Invalid email or password. Please check your credentials.';
				} else {
					error = 'Authentication failed. Please check your credentials.';
				}
			} else if (err.status === 423) {
				const lockoutTime = err.data?.lockoutExpiresAt ? 
					new Date(err.data.lockoutExpiresAt).toLocaleTimeString() : 'later';
				error = `Account temporarily locked. Try again after ${lockoutTime}.`;
			} else if (err.status === 429) {
				error = 'Too many login attempts. Please wait a few minutes before trying again.';
			} else if (err.status >= 500) {
				error = 'Server error. Please try again in a few minutes.';
				toastStore.error('Login service is temporarily unavailable');
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
		goto('/forgot-password');
	}

	function goToActivateAccount() {
		goto('/activate');
	}

	function goToAdminLogin() {
		goto('/admin/login');
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
	<title>Client Login - NOURX</title>
	<meta name="description" content="Sign in to your NOURX client account to access projects, invoices, and support" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="text-center mb-8">
			<button on:click={goHome} class="text-3xl font-bold text-slate-900 dark:text-slate-50 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
				NOURX
			</button>
			<p class="text-slate-600 dark:text-slate-400 mt-2">Sign in to your client account</p>
		</div>

		<!-- Login Form -->
		<Card class="p-8">
			{#if error}
				<Alert color="red" class="mb-6">
					<span class="font-medium">Error:</span> {error}
				</Alert>
			{/if}

			<form on:submit|preventDefault={handleLogin} class="space-y-6">
				<!-- Email Field -->
				<div>
					<Label for="email" class="mb-2">Email address</Label>
					<Input
						id="email"
						type="email"
						placeholder="Enter your email"
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
					<Label for="password" class="mb-2">Password</Label>
					<Input
						id="password"
						type="password"
						placeholder="Enter your password"
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
						Remember me
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
				>
					{#if loading}
						<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						Signing in...
					{:else}
						Sign in
					{/if}
				</Button>
			</form>

			<!-- Additional Links -->
			<div class="mt-6 text-center space-y-3">
				<button
					on:click={goToActivateAccount}
					class="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
					disabled={loading}
				>
					Need to activate your account?
				</button>

				<div class="border-t border-slate-200 dark:border-slate-700 pt-4">
					<p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
						Are you a NOURX team member?
					</p>
					<Button
						on:click={goToAdminLogin}
						color="alternative"
						size="sm"
						disabled={loading}
					>
						Admin Login
					</Button>
				</div>
			</div>
		</Card>

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
