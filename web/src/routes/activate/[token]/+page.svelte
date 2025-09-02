<script>
	import { Card, Button, Input, Label, Alert } from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth';
	import { toastStore } from '$lib/stores/toast';
	import { authAPI } from '$lib/api/auth';

	let token = '';
	let password = '';
	let confirmPassword = '';
	let loading = false;
	let success = false;
	let error = '';
	let tokenValid = null; // null = checking, true = valid, false = invalid

	// Form validation errors
	let fieldErrors = {
		password: '',
		confirmPassword: ''
	};

	onMount(() => {
		// Get token from URL params
		token = $page.params.token;
		
		// Validate token format
		if (!token || token.length < 10) {
			tokenValid = false;
			error = 'Invalid activation link. Please check your email and try again.';
		} else {
			tokenValid = true;
		}
	});

	function validateForm() {
		fieldErrors = { password: '', confirmPassword: '' };
		let isValid = true;

		// Password validation
		if (!password) {
			fieldErrors.password = 'Password is required';
			isValid = false;
		} else if (password.length < 8) {
			fieldErrors.password = 'Password must be at least 8 characters long';
			isValid = false;
		} else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
			fieldErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
			isValid = false;
		}

		// Confirm password validation
		if (!confirmPassword) {
			fieldErrors.confirmPassword = 'Please confirm your password';
			isValid = false;
		} else if (password !== confirmPassword) {
			fieldErrors.confirmPassword = 'Passwords do not match';
			isValid = false;
		}

		return isValid;
	}

	async function handleActivation() {
		if (!validateForm()) {
			return;
		}

		loading = true;
		error = '';

		try {
			const response = await authAPI.activateAccount(token, password);
			
			// Store auth data from activation response
			authStore.login(
				{ 
					accessToken: response.data.accessToken, 
					refreshToken: response.data.refreshToken 
				}, 
				response.data.user, 
				response.data.user.userType || 'client'
			);

			success = true;
			toastStore.success('Account activated successfully! Welcome to NOURX.');
			
			// Redirect after a short delay
			setTimeout(() => {
				const redirectPath = response.data.user.userType === 'admin' ? '/admin' : '/app';
				goto(redirectPath);
			}, 2000);
			
		} catch (err) {
			console.error('Account activation error:', err);
			
			// Handle specific error cases
			if (err.status === 400) {
				if (err.data?.error?.includes('expired')) {
					error = 'This activation link has expired. Please request a new one.';
				} else if (err.data?.error?.includes('invalid')) {
					error = 'Invalid activation token. Please check your email and try again.';
				} else if (err.data?.error?.includes('already activated')) {
					error = 'This account has already been activated. Please try logging in instead.';
					setTimeout(() => goto('/login'), 3000);
				} else {
					error = err.data?.error || 'Account activation failed. Please try again.';
				}
			} else if (err.status >= 500) {
				error = 'Account activation service is temporarily unavailable. Please try again later.';
			} else if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
				error = 'Network error. Please check your internet connection.';
			} else {
				error = 'An unexpected error occurred during activation. Please try again.';
			}
		} finally {
			loading = false;
		}
	}

	function goToLogin() {
		goto('/login');
	}

	function goHome() {
		goto('/');
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter' && !loading) {
			handleActivation();
		}
	}

	// Password strength indicator
	$: passwordStrength = (() => {
		if (!password) return { score: 0, label: '', color: '' };
		
		let score = 0;
		if (password.length >= 8) score++;
		if (/[a-z]/.test(password)) score++;
		if (/[A-Z]/.test(password)) score++;
		if (/\d/.test(password)) score++;
		if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
		
		if (score < 2) return { score, label: 'Weak', color: 'text-red-600' };
		if (score < 4) return { score, label: 'Fair', color: 'text-yellow-600' };
		if (score < 5) return { score, label: 'Good', color: 'text-blue-600' };
		return { score, label: 'Strong', color: 'text-green-600' };
	})();
</script>

<svelte:head>
	<title>Activate Account - NOURX</title>
	<meta name="description" content="Activate your NOURX account and set your password" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="text-center mb-8">
			<button on:click={goHome} class="text-3xl font-bold text-slate-900 dark:text-slate-50 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
				NOURX
			</button>
			<p class="text-slate-600 dark:text-slate-400 mt-2">Activate your account</p>
		</div>

		<!-- Activation Form -->
		<Card class="p-8">
			{#if success}
				<Alert color="green" class="mb-6">
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span class="font-medium">Account activated!</span>
					</div>
					<p class="mt-2 text-sm">
						Your account has been successfully activated. You will be redirected to your dashboard shortly.
					</p>
				</Alert>
			{:else if tokenValid === false || error}
				<Alert color="red" class="mb-6">
					<span class="font-medium">Activation Error:</span> {error || 'Invalid activation link'}
				</Alert>
			{/if}

			{#if tokenValid && !success}
				<div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
					<div class="flex items-start space-x-3">
						<svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div>
							<p class="text-sm font-medium text-blue-900 dark:text-blue-100">Almost there!</p>
							<p class="text-xs text-blue-700 dark:text-blue-300 mt-1">
								Please create a secure password to complete your account activation.
							</p>
						</div>
					</div>
				</div>

				<form on:submit|preventDefault={handleActivation} class="space-y-6">
					<!-- Password Field -->
					<div>
						<Label for="password" class="mb-2">Password</Label>
						<Input
							id="password"
							type="password"
							placeholder="Create a strong password"
							bind:value={password}
							required
							disabled={loading}
							class="focus-ring {fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}"
							on:keypress={handleKeyPress}
							autocomplete="new-password"
						/>
						{#if fieldErrors.password}
							<p class="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.password}</p>
						{:else if password && passwordStrength.score > 0}
							<p class="mt-1 text-sm {passwordStrength.color}">
								Password strength: {passwordStrength.label}
							</p>
						{/if}
					</div>

					<!-- Confirm Password Field -->
					<div>
						<Label for="confirmPassword" class="mb-2">Confirm Password</Label>
						<Input
							id="confirmPassword"
							type="password"
							placeholder="Confirm your password"
							bind:value={confirmPassword}
							required
							disabled={loading}
							class="focus-ring {fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : ''}"
							on:keypress={handleKeyPress}
							autocomplete="new-password"
						/>
						{#if fieldErrors.confirmPassword}
							<p class="mt-1 text-sm text-red-600 dark:text-red-400">{fieldErrors.confirmPassword}</p>
						{:else if confirmPassword && password === confirmPassword}
							<p class="mt-1 text-sm text-green-600 dark:text-green-400">
								✓ Passwords match
							</p>
						{/if}
					</div>

					<!-- Password Requirements -->
					<div class="text-xs text-slate-600 dark:text-slate-400">
						<p class="font-medium mb-1">Password requirements:</p>
						<ul class="space-y-1">
							<li class="flex items-center {password.length >= 8 ? 'text-green-600' : ''}">
								<span class="mr-1">{password.length >= 8 ? '✓' : '•'}</span>
								At least 8 characters long
							</li>
							<li class="flex items-center {/[a-z]/.test(password) ? 'text-green-600' : ''}">
								<span class="mr-1">{/[a-z]/.test(password) ? '✓' : '•'}</span>
								One lowercase letter
							</li>
							<li class="flex items-center {/[A-Z]/.test(password) ? 'text-green-600' : ''}">
								<span class="mr-1">{/[A-Z]/.test(password) ? '✓' : '•'}</span>
								One uppercase letter
							</li>
							<li class="flex items-center {/\d/.test(password) ? 'text-green-600' : ''}">
								<span class="mr-1">{/\d/.test(password) ? '✓' : '•'}</span>
								One number
							</li>
						</ul>
					</div>

					<!-- Submit Button -->
					<Button
						type="submit"
						class="w-full"
						size="lg"
						disabled={loading || !password || !confirmPassword || password !== confirmPassword}
					>
						{#if loading}
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Activating account...
						{:else}
							Activate Account
						{/if}
					</Button>
				</form>
			{/if}

			<!-- Navigation Links -->
			{#if tokenValid === false}
				<div class="mt-6 text-center">
					<div class="border-t border-slate-200 dark:border-slate-700 pt-4">
						<p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
							Already have an active account?
						</p>
						<Button
							on:click={goToLogin}
							color="alternative"
							size="sm"
							disabled={loading}
						>
							Sign In Instead
						</Button>
					</div>
				</div>
			{/if}
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
