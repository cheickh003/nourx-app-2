<script>
	import { Card, Button, Alert } from 'flowbite-svelte';
	import { goto } from '$app/navigation';

	function goToLogin() {
		goto('/login');
	}

	function goToForgotPassword() {
		goto('/forgot-password');
	}

	function goHome() {
		goto('/');
	}
</script>

<svelte:head>
	<title>Account Activation - NOURX</title>
	<meta name="description" content="Activate your NOURX account" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
	<div class="w-full max-w-md">
		<!-- Header -->
		<div class="text-center mb-8">
			<button on:click={goHome} class="text-3xl font-bold text-slate-900 dark:text-slate-50 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
				NOURX
			</button>
			<p class="text-slate-600 dark:text-slate-400 mt-2">Account Activation</p>
		</div>

		<!-- Information Card -->
		<Card class="p-8">
			<div class="text-center">
				<div class="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>

				<h1 class="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
					Check Your Email
				</h1>
				
				<p class="text-slate-600 dark:text-slate-400 mb-6">
					To activate your NOURX account, please click the activation link in the email we sent to you.
				</p>

				<Alert color="blue" class="text-left mb-6">
					<div class="flex items-start">
						<svg class="w-5 h-5 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div>
							<p class="font-medium text-sm">Didn't receive the email?</p>
							<ul class="text-sm mt-1 space-y-1">
								<li>• Check your spam or junk folder</li>
								<li>• Make sure you entered the correct email address</li>
								<li>• The email may take a few minutes to arrive</li>
							</ul>
						</div>
					</div>
				</Alert>

				<div class="space-y-3">
					<Button
						on:click={goToLogin}
						class="w-full"
						size="lg"
					>
						Already Activated? Sign In
					</Button>

					<Button
						on:click={goToForgotPassword}
						color="alternative"
						class="w-full"
						size="sm"
					>
						Need a Password Reset Instead?
					</Button>
				</div>
			</div>
		</Card>

		<!-- Help Section -->
		<div class="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
			<div class="flex items-start space-x-3">
				<svg class="w-5 h-5 text-slate-600 dark:text-slate-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<div>
					<p class="text-sm font-medium text-slate-900 dark:text-slate-100">Need Help?</p>
					<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">
						If you're still having trouble activating your account, please contact our support team.
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
