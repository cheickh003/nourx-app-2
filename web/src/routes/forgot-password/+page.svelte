<script>
	import { Card, Button, Input, Label, Alert, Select } from 'flowbite-svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { toastStore } from '$lib/stores/toast';
	import { authAPI } from '$lib/api/auth';

	let email = '';
	let userType = 'client'; // Default to client
	let loading = false;
	let success = false;
	let error = '';

	// Form validation errors
	let fieldErrors = {
		email: ''
	};

	onMount(() => {
		// Get user type from URL params if provided
		const urlUserType = $page.url.searchParams.get('type');
		if (urlUserType === 'admin' || urlUserType === 'client') {
			userType = urlUserType;
		}
	});

	function validateForm() {
		fieldErrors = { email: '' };
		let isValid = true;

		// Email validation
		if (!email.trim()) {
			fieldErrors.email = 'Email is required';
			isValid = false;
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			fieldErrors.email = 'Please enter a valid email address';
			isValid = false;
		}

		return isValid;
	}

	async function handleForgotPassword() {
		if (!validateForm()) {
			return;
		}

		loading = true;
		error = '';
		success = false;

		try {
			await authAPI.forgotPassword(email.trim(), userType);
			
			success = true;
			toastStore.success('Password reset email sent successfully!');
			
		} catch (err) {
			console.error('Forgot password error:', err);
			
			// Handle specific error cases
			if (err.status === 429) {
				error = 'Too many reset requests. Please wait before requesting another password reset.';
			} else if (err.status >= 500) {
				error = 'Password reset service is temporarily unavailable. Please try again later.';
			} else if (err.name === 'TypeError' || err.message === 'Failed to fetch') {
				error = 'Network error. Please check your internet connection.';
			} else {
				// For security, we don't reveal if the email exists or not
				success = true;
				toastStore.info('If an account with that email exists, a password reset link has been sent.');
			}
		} finally {
			loading = false;
		}
	}

	function goToLogin() {
		const loginPath = userType === 'admin' ? '/admin/login' : '/login';
		goto(loginPath);
	}

	function goHome() {
		goto('/');
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter' && !loading) {
			handleForgotPassword();
		}
	}

	$: userTypeOptions = [
		{ value: 'client', name: 'Client Account' },
		{ value: 'admin', name: 'Admin Account' }
	];
</script>

<svelte:head>
	<title>Forgot Password - NOURX</title>
	<meta name="description" content="Reset your NOURX account password" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="text-center mb-8">
			<button on:click={goHome} class="text-3xl font-bold text-slate-900 dark:text-slate-50 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
				NOURX
			</button>
			<p class="text-slate-600 dark:text-slate-400 mt-2">Reset your password</p>
		</div>

		<!-- Reset Form -->
		<Card class="p-8">
			{#if success}
				<Alert color="green" class="mb-6">
					<div class="flex items-center">
						<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
						<span class="font-medium">Email sent!</span>
					</div>
					<p class="mt-2 text-sm">
						If an account with that email exists, we've sent a password reset link. 
						Please check your email inbox and spam folder.
					</p>
				</Alert>
			{:else if error}
				<Alert color="red" class="mb-6">
					<span class="font-medium">Error:</span> {error}
				</Alert>
			{/if}

			{#if !success}
				<form on:submit|preventDefault={handleForgotPassword} class="space-y-6">
					<!-- Account Type -->
					<div>
						<Label for="userType" class="mb-2">Account Type</Label>
						<Select id="userType" bind:value={userType} disabled={loading}>
							{#each userTypeOptions as option}
								<option value={option.value}>{option.name}</option>
							{/each}
						</Select>
					</div>

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

					<!-- Submit Button -->
					<Button
						type="submit"
						class="w-full"
						size="lg"
						disabled={loading || !email.trim()}
					>
						{#if loading}
							<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Sending reset email...
						{:else}
							Send Reset Email
						{/if}
					</Button>
				</form>
			{/if}

			<!-- Navigation Links -->
			<div class="mt-6 text-center">
				<div class="border-t border-slate-200 dark:border-slate-700 pt-4">
					<p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
						Remember your password?
					</p>
					<Button
						on:click={goToLogin}
						color="alternative"
						size="sm"
						disabled={loading}
					>
						Back to Sign In
					</Button>
				</div>
			</div>
		</Card>

		{#if success}
			<!-- Instructions -->
			<div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
				<div class="flex items-start space-x-3">
					<svg class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div>
						<p class="text-sm font-medium text-blue-900 dark:text-blue-100">Next Steps</p>
						<ul class="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
							<li>• Check your email inbox for a message from NOURX</li>
							<li>• Click the password reset link in the email</li>
							<li>• Create a new secure password</li>
							<li>• Sign in with your new password</li>
						</ul>
					</div>
				</div>
			</div>
		{/if}

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
