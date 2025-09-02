<script>
    import { Card, Button, Input, Label, Textarea, Select, Toggle, Tabs, TabItem, Badge } from 'flowbite-svelte';
    import { toastStore } from '$lib/stores/toast';
	
	let systemSettings = {
		siteName: 'NOURX',
		supportEmail: 'support@nourx.com',
		maxFileSize: '50',
		sessionTimeout: '24',
		maintenanceMode: false,
		registrationEnabled: true
	};
	
	let emailSettings = {
		smtpHost: 'smtp.mailtrap.io',
		smtpPort: '587',
		smtpUser: 'nourx_smtp',
		smtpPassword: '***********',
		fromEmail: 'noreply@nourx.com',
		fromName: 'NOURX Platform'
	};
	
	let securitySettings = {
		passwordMinLength: '8',
		passwordRequireSpecial: true,
		maxLoginAttempts: '5',
		lockoutDuration: '30',
		twoFactorEnabled: false,
		sessionSecure: true
	};
	
	let notificationSettings = {
		newUserSignup: true,
		ticketCreated: true,
		paymentReceived: true,
		systemErrors: true,
		maintenanceAlerts: true
	};
	
    /** @param {string} category */
    function saveSettings(category) {
        // Fake save + toast
        toastStore.success(`${category} settings saved successfully!`, 'Saved');
    }

    function runDiagnostics() {
        toastStore.info('System diagnostics started. This may take a minute.', 'Diagnostics');
        setTimeout(() => toastStore.success('Diagnostics completed with no critical issues.', 'Diagnostics'), 800);
    }

    function testEmailConnection() {
        toastStore.info('Testing SMTP connection...', 'Email');
        setTimeout(() => toastStore.success('SMTP connection successful.', 'Email'), 600);
    }
</script>

<svelte:head>
	<title>System Settings - NOURX Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">System Settings</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Configure system-wide settings and preferences</p>
		</div>
		<div class="flex gap-2">
			<Badge color="green">All Systems Operational</Badge>
		</div>
	</div>

	<!-- Settings Tabs -->
	<Tabs>
		<TabItem open title="General">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">System Configuration</h3>
					</div>
					<div class="space-y-4 p-6">
						<div>
							<Label for="siteName" class="mb-2">Site Name</Label>
							<Input id="siteName" bind:value={systemSettings.siteName} />
						</div>
						<div>
							<Label for="supportEmail" class="mb-2">Support Email</Label>
							<Input id="supportEmail" type="email" bind:value={systemSettings.supportEmail} />
						</div>
						<div>
							<Label for="maxFileSize" class="mb-2">Max File Size (MB)</Label>
							<Input id="maxFileSize" type="number" bind:value={systemSettings.maxFileSize} />
						</div>
						<div>
							<Label for="sessionTimeout" class="mb-2">Session Timeout (hours)</Label>
							<Input id="sessionTimeout" type="number" bind:value={systemSettings.sessionTimeout} />
						</div>
						<div class="flex items-center gap-3">
							<Toggle bind:checked={systemSettings.maintenanceMode} />
							<Label>Maintenance Mode</Label>
						</div>
						<div class="flex items-center gap-3">
							<Toggle bind:checked={systemSettings.registrationEnabled} />
							<Label>Enable User Registration</Label>
						</div>
						<Button color="primary" on:click={() => saveSettings('System')}>
							Save System Settings
						</Button>
					</div>
				</Card>

				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">System Status</h3>
					</div>
					<div class="space-y-4 p-6">
						<div class="flex justify-between items-center">
							<span class="font-medium">Database</span>
							<Badge color="green">Connected</Badge>
						</div>
						<div class="flex justify-between items-center">
							<span class="font-medium">Email Service</span>
							<Badge color="green">Active</Badge>
						</div>
						<div class="flex justify-between items-center">
							<span class="font-medium">File Storage</span>
							<Badge color="green">Available</Badge>
						</div>
						<div class="flex justify-between items-center">
							<span class="font-medium">Background Jobs</span>
							<Badge color="yellow">2 Pending</Badge>
						</div>
						<div class="flex justify-between items-center">
							<span class="font-medium">System Load</span>
							<Badge color="green">Normal</Badge>
						</div>
            <Button color="alternative" class="w-full" on:click={runDiagnostics}>
                Run System Diagnostics
            </Button>
					</div>
				</Card>
			</div>
		</TabItem>

		<TabItem title="Email">
			<Card>
				<div class="p-6 pb-2">
					<h3 class="text-lg font-semibold">SMTP Configuration</h3>
				</div>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
					<div class="space-y-4">
						<div>
							<Label for="smtpHost" class="mb-2">SMTP Host</Label>
							<Input id="smtpHost" bind:value={emailSettings.smtpHost} />
						</div>
						<div>
							<Label for="smtpPort" class="mb-2">SMTP Port</Label>
							<Input id="smtpPort" type="number" bind:value={emailSettings.smtpPort} />
						</div>
						<div>
							<Label for="smtpUser" class="mb-2">SMTP Username</Label>
							<Input id="smtpUser" bind:value={emailSettings.smtpUser} />
						</div>
						<div>
							<Label for="smtpPassword" class="mb-2">SMTP Password</Label>
							<Input id="smtpPassword" type="password" bind:value={emailSettings.smtpPassword} />
						</div>
					</div>
					<div class="space-y-4">
						<div>
							<Label for="fromEmail" class="mb-2">From Email</Label>
							<Input id="fromEmail" type="email" bind:value={emailSettings.fromEmail} />
						</div>
						<div>
							<Label for="fromName" class="mb-2">From Name</Label>
							<Input id="fromName" bind:value={emailSettings.fromName} />
						</div>
						<div class="pt-4">
            <Button color="alternative" class="w-full mb-2" on:click={testEmailConnection}>
                Test Email Connection
            </Button>
							<Button color="primary" class="w-full" on:click={() => saveSettings('Email')}>
								Save Email Settings
							</Button>
						</div>
					</div>
				</div>
			</Card>
		</TabItem>

		<TabItem title="Security">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Password Policy</h3>
					</div>
					<div class="space-y-4 p-6">
						<div>
							<Label for="passwordMinLength" class="mb-2">Minimum Password Length</Label>
							<Input id="passwordMinLength" type="number" bind:value={securitySettings.passwordMinLength} />
						</div>
						<div class="flex items-center gap-3">
							<Toggle bind:checked={securitySettings.passwordRequireSpecial} />
							<Label>Require Special Characters</Label>
						</div>
						<div>
							<Label for="maxLoginAttempts" class="mb-2">Max Login Attempts</Label>
							<Input id="maxLoginAttempts" type="number" bind:value={securitySettings.maxLoginAttempts} />
						</div>
						<div>
							<Label for="lockoutDuration" class="mb-2">Lockout Duration (minutes)</Label>
							<Input id="lockoutDuration" type="number" bind:value={securitySettings.lockoutDuration} />
						</div>
					</div>
				</Card>

				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Authentication</h3>
					</div>
					<div class="space-y-4 p-6">
						<div class="flex items-center gap-3">
							<Toggle bind:checked={securitySettings.twoFactorEnabled} />
							<Label>Enable Two-Factor Authentication</Label>
						</div>
						<div class="flex items-center gap-3">
							<Toggle bind:checked={securitySettings.sessionSecure} />
							<Label>Secure Session Cookies</Label>
						</div>
						<div class="pt-4">
							<Button color="primary" on:click={() => saveSettings('Security')}>
								Save Security Settings
							</Button>
						</div>
					</div>
				</Card>
			</div>
		</TabItem>

		<TabItem title="Notifications">
			<Card>
				<div class="p-6 pb-2">
					<h3 class="text-lg font-semibold">Email Notifications</h3>
				</div>
				<div class="space-y-4 p-6">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div class="space-y-4">
							<div class="flex items-center gap-3">
								<Toggle bind:checked={notificationSettings.newUserSignup} />
								<Label>New User Signup</Label>
							</div>
							<div class="flex items-center gap-3">
								<Toggle bind:checked={notificationSettings.ticketCreated} />
								<Label>New Support Ticket</Label>
							</div>
							<div class="flex items-center gap-3">
								<Toggle bind:checked={notificationSettings.paymentReceived} />
								<Label>Payment Received</Label>
							</div>
						</div>
						<div class="space-y-4">
							<div class="flex items-center gap-3">
								<Toggle bind:checked={notificationSettings.systemErrors} />
								<Label>System Errors</Label>
							</div>
							<div class="flex items-center gap-3">
								<Toggle bind:checked={notificationSettings.maintenanceAlerts} />
								<Label>Maintenance Alerts</Label>
							</div>
						</div>
					</div>
					<div class="pt-4">
						<Button color="primary" on:click={() => saveSettings('Notifications')}>
							Save Notification Settings
						</Button>
					</div>
				</div>
			</Card>
		</TabItem>

		<TabItem title="Backup">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Database Backup</h3>
					</div>
					<div class="space-y-4 p-6">
						<div class="text-sm text-slate-600 dark:text-slate-400">
							<p>Last backup: August 25, 2024 at 02:00 AM</p>
							<p>Backup size: 2.4 GB</p>
							<p>Status: Successful</p>
						</div>
						<div class="space-y-2">
							<Button color="primary" class="w-full">Create Backup Now</Button>
							<Button color="alternative" class="w-full">Download Latest Backup</Button>
							<Button color="alternative" class="w-full">Restore from Backup</Button>
						</div>
					</div>
				</Card>

				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Backup Schedule</h3>
					</div>
					<div class="space-y-4 p-6">
						<div>
							<Label for="backupFrequency" class="mb-2">Backup Frequency</Label>
							<Select id="backupFrequency">
								<option value="daily">Daily</option>
								<option value="weekly">Weekly</option>
								<option value="monthly">Monthly</option>
							</Select>
						</div>
						<div>
							<Label for="backupTime" class="mb-2">Backup Time</Label>
							<Input id="backupTime" type="time" value="02:00" />
						</div>
						<div>
							<Label for="retentionDays" class="mb-2">Retention Period (days)</Label>
							<Input id="retentionDays" type="number" value="30" />
						</div>
						<Button color="primary" class="w-full">Save Backup Settings</Button>
					</div>
				</Card>
			</div>
		</TabItem>
	</Tabs>
</div>
