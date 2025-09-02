<script>
	import { Card, Button, Input, Label, Select, Toggle, Tabs, TabItem, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Badge, Modal } from 'flowbite-svelte';
	import { toastStore } from '$lib/stores/toast';
	
	let userProfile = {
		email: 'client@democlient.com',
		firstName: 'John',
		lastName: 'Smith',
		phone: '+1 (555) 123-4567',
		jobTitle: 'Marketing Director',
		company: 'NOURX Demo Client',
		timezone: 'America/New_York',
		language: 'English'
	};
	
	let organizationProfile = {
		name: 'NOURX Demo Client',
		industry: 'Technology',
		size: '50-200 employees',
		website: 'https://democlient.com',
		address: '123 Business St.',
		city: 'New York',
		state: 'NY',
		zipCode: '10001',
		country: 'United States'
	};
	
	let securitySettings = {
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
		twoFactorEnabled: false,
		emailNotifications: true,
		smsNotifications: false
	};
	
	let teamMembers = [
		{
			id: 1,
			email: 'john@democlient.com',
			firstName: 'John',
			lastName: 'Smith',
			role: 'Owner',
			status: 'Active',
			lastLogin: '2024-08-25 14:30',
			joinDate: '2024-06-01'
		},
		{
			id: 2,
			email: 'sarah@democlient.com',
			firstName: 'Sarah',
			lastName: 'Johnson',
			role: 'Manager',
			status: 'Active',
			lastLogin: '2024-08-24 16:45',
			joinDate: '2024-07-15'
		},
		{
			id: 3,
			email: 'mike@democlient.com',
			firstName: 'Mike',
			lastName: 'Wilson',
			role: 'Reader',
			status: 'Inactive',
			lastLogin: '2024-08-20 10:20',
			joinDate: '2024-08-01'
		}
	];
	
	let showInviteModal = false;
	let inviteEmail = '';
	let inviteRole = 'Reader';
	
	function saveProfile() {
		// TODO: Implement save functionality
		toastStore.success('Profile updated successfully!', 'Saved');
	}
	
	function saveOrganization() {
		// TODO: Implement save functionality
		toastStore.success('Organization profile updated successfully!', 'Saved');
	}
	
	function changePassword() {
		if (securitySettings.newPassword !== securitySettings.confirmPassword) {
			toastStore.error('New passwords do not match!', 'Error');
			return;
		}
		// TODO: Implement password change
		toastStore.success('Password changed successfully!', 'Saved');
		securitySettings.currentPassword = '';
		securitySettings.newPassword = '';
		securitySettings.confirmPassword = '';
	}
	
	function inviteTeamMember() {
		// TODO: Implement team member invitation
		showInviteModal = false;
		inviteEmail = '';
		inviteRole = 'Reader';
		toastStore.success('Invitation sent successfully!', 'Sent');
	}
	
/** @param {{firstName: string; lastName: string}} member */
	function removeTeamMember(member) {
		if (confirm(`Remove ${member.firstName} ${member.lastName} from the team?`)) {
			// TODO: Implement team member removal
			toastStore.success('Team member removed successfully!', 'Removed');
		}
	}
	
/**
 * @param {{firstName: string; lastName?: string}} member
 * @param {string} newRole
 */
	function changeTeamMemberRole(member, newRole) {
		// TODO: Implement role change
		toastStore.info(`Changed ${member.firstName}'s role to ${newRole}`, 'Role Updated');
	}
	
/** @param {string} role */
function getRoleColor(role) {
    switch (role) {
        case 'Owner': return 'red';
        case 'Manager': return 'blue';
        case 'Reader': return 'none';
        default: return 'dark';
    }
}
</script>

<svelte:head>
	<title>Account Settings - NOURX Client Portal</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold text-slate-900 dark:text-slate-50">Account Settings</h1>
		<p class="text-slate-600 dark:text-slate-400 mt-1">Manage your profile, organization, and team settings</p>
	</div>

	<!-- Account Tabs -->
	<Tabs>
		<TabItem open title="Profile">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Personal Information</h3>
					</div>
					<div class="space-y-4 p-6">
						<div class="grid grid-cols-2 gap-4">
							<div>
								<Label for="firstName" class="mb-2">First Name</Label>
								<Input id="firstName" bind:value={userProfile.firstName} />
							</div>
							<div>
								<Label for="lastName" class="mb-2">Last Name</Label>
								<Input id="lastName" bind:value={userProfile.lastName} />
							</div>
						</div>
						<div>
							<Label for="email" class="mb-2">Email Address</Label>
							<Input id="email" type="email" bind:value={userProfile.email} />
						</div>
						<div>
							<Label for="phone" class="mb-2">Phone Number</Label>
							<Input id="phone" bind:value={userProfile.phone} />
						</div>
						<div>
							<Label for="jobTitle" class="mb-2">Job Title</Label>
							<Input id="jobTitle" bind:value={userProfile.jobTitle} />
						</div>
						<Button color="primary" on:click={saveProfile}>
							Save Profile
						</Button>
					</div>
				</Card>

				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Preferences</h3>
					</div>
					<div class="space-y-4 p-6">
						<div>
							<Label for="timezone" class="mb-2">Timezone</Label>
							<Select id="timezone" bind:value={userProfile.timezone}>
								<option value="America/New_York">Eastern Time (ET)</option>
								<option value="America/Chicago">Central Time (CT)</option>
								<option value="America/Denver">Mountain Time (MT)</option>
								<option value="America/Los_Angeles">Pacific Time (PT)</option>
								<option value="UTC">UTC</option>
							</Select>
						</div>
						<div>
							<Label for="language" class="mb-2">Language</Label>
							<Select id="language" bind:value={userProfile.language}>
								<option value="English">English</option>
								<option value="French">Français</option>
								<option value="Spanish">Español</option>
								<option value="German">Deutsch</option>
							</Select>
						</div>
						
						<div class="pt-4 border-t border-slate-200 dark:border-slate-700">
							<h4 class="font-medium text-slate-900 dark:text-slate-50 mb-4">Notifications</h4>
							<div class="space-y-3">
								<div class="flex items-center gap-3">
									<Toggle bind:checked={securitySettings.emailNotifications} />
									<Label>Email notifications</Label>
								</div>
								<div class="flex items-center gap-3">
									<Toggle bind:checked={securitySettings.smsNotifications} />
									<Label>SMS notifications</Label>
								</div>
							</div>
						</div>
					</div>
				</Card>
			</div>
		</TabItem>

		<TabItem title="Organization">
			<Card>
				<div class="p-6 pb-2">
					<h3 class="text-lg font-semibold">Organization Details</h3>
				</div>
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
					<div class="space-y-4">
						<div>
							<Label for="orgName" class="mb-2">Organization Name</Label>
							<Input id="orgName" bind:value={organizationProfile.name} />
						</div>
						<div>
							<Label for="industry" class="mb-2">Industry</Label>
							<Select id="industry" bind:value={organizationProfile.industry}>
								<option value="Technology">Technology</option>
								<option value="Healthcare">Healthcare</option>
								<option value="Finance">Finance</option>
								<option value="Education">Education</option>
								<option value="Retail">Retail</option>
								<option value="Manufacturing">Manufacturing</option>
								<option value="Other">Other</option>
							</Select>
						</div>
						<div>
							<Label for="size" class="mb-2">Company Size</Label>
							<Select id="size" bind:value={organizationProfile.size}>
								<option value="1-10 employees">1-10 employees</option>
								<option value="11-50 employees">11-50 employees</option>
								<option value="51-200 employees">51-200 employees</option>
								<option value="201-500 employees">201-500 employees</option>
								<option value="501+ employees">501+ employees</option>
							</Select>
						</div>
						<div>
							<Label for="website" class="mb-2">Website</Label>
							<Input id="website" bind:value={organizationProfile.website} />
						</div>
					</div>
					<div class="space-y-4">
						<div>
							<Label for="address" class="mb-2">Address</Label>
							<Input id="address" bind:value={organizationProfile.address} />
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<Label for="city" class="mb-2">City</Label>
								<Input id="city" bind:value={organizationProfile.city} />
							</div>
							<div>
								<Label for="state" class="mb-2">State</Label>
								<Input id="state" bind:value={organizationProfile.state} />
							</div>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<Label for="zipCode" class="mb-2">ZIP Code</Label>
								<Input id="zipCode" bind:value={organizationProfile.zipCode} />
							</div>
							<div>
								<Label for="country" class="mb-2">Country</Label>
								<Select id="country" bind:value={organizationProfile.country}>
									<option value="United States">United States</option>
									<option value="Canada">Canada</option>
									<option value="United Kingdom">United Kingdom</option>
									<option value="France">France</option>
									<option value="Germany">Germany</option>
									<option value="Other">Other</option>
								</Select>
							</div>
						</div>
					</div>
				</div>
				<div class="px-6 pb-6">
					<Button color="primary" on:click={saveOrganization}>
						Save Organization
					</Button>
				</div>
			</Card>
		</TabItem>

		<TabItem title="Security">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Change Password</h3>
					</div>
					<div class="space-y-4 p-6">
						<div>
							<Label for="currentPassword" class="mb-2">Current Password</Label>
							<Input id="currentPassword" type="password" bind:value={securitySettings.currentPassword} />
						</div>
						<div>
							<Label for="newPassword" class="mb-2">New Password</Label>
							<Input id="newPassword" type="password" bind:value={securitySettings.newPassword} />
						</div>
						<div>
							<Label for="confirmPassword" class="mb-2">Confirm New Password</Label>
							<Input id="confirmPassword" type="password" bind:value={securitySettings.confirmPassword} />
						</div>
						<Button color="primary" on:click={changePassword}>
							Change Password
						</Button>
					</div>
				</Card>

				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Two-Factor Authentication</h3>
					</div>
					<div class="space-y-4 p-6">
						<div class="flex items-center gap-3">
							<Toggle bind:checked={securitySettings.twoFactorEnabled} />
							<div>
								<Label class="font-medium">Enable Two-Factor Authentication</Label>
								<p class="text-sm text-slate-600 dark:text-slate-400">
									Add an extra layer of security to your account
								</p>
							</div>
						</div>
						{#if securitySettings.twoFactorEnabled}
							<div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
								<p class="text-sm text-green-700 dark:text-green-400">
									Two-factor authentication is enabled. You'll receive a verification code via your authenticator app when signing in.
								</p>
							</div>
							<Button color="alternative">
								Manage 2FA Settings
							</Button>
						{:else}
							<div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
								<p class="text-sm text-yellow-700 dark:text-yellow-400">
									Two-factor authentication is disabled. Enable it to improve your account security.
								</p>
							</div>
							<Button color="primary">
								Setup 2FA
							</Button>
						{/if}
					</div>
				</Card>
			</div>
		</TabItem>

		<TabItem title="Team">
			<Card>
				<div class="p-6 pb-2 flex justify-between items-center">
					<h3 class="text-lg font-semibold">Team Members</h3>
					<Button color="primary" size="sm" on:click={() => showInviteModal = true}>
						<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
						</svg>
						Invite Member
					</Button>
				</div>
				
				<Table hoverable>
					<TableHead>
						<TableHeadCell>Member</TableHeadCell>
						<TableHeadCell>Role</TableHeadCell>
						<TableHeadCell>Status</TableHeadCell>
						<TableHeadCell>Last Login</TableHeadCell>
						<TableHeadCell>Actions</TableHeadCell>
					</TableHead>
					<TableBody>
						{#each teamMembers as member}
							<TableBodyRow>
								<TableBodyCell>
									<div>
										<div class="font-medium text-slate-900 dark:text-slate-50">
											{member.firstName} {member.lastName}
										</div>
										<div class="text-sm text-slate-500">{member.email}</div>
									</div>
								</TableBodyCell>
								<TableBodyCell>
									<Badge color={getRoleColor(member.role)}>{member.role}</Badge>
								</TableBodyCell>
								<TableBodyCell>
                            <Badge color={member.status === 'Active' ? 'green' : 'dark'}>{member.status}</Badge>
								</TableBodyCell>
								<TableBodyCell class="text-slate-600 dark:text-slate-400">
									{member.lastLogin}
								</TableBodyCell>
								<TableBodyCell>
									<div class="flex gap-2">
										{#if member.role !== 'Owner'}
											<Select bind:value={member.role} size="sm" on:change={() => changeTeamMemberRole(member, member.role)}>
												<option value="Reader">Reader</option>
												<option value="Manager">Manager</option>
											</Select>
											<Button color="red" size="xs" on:click={() => removeTeamMember(member)}>Remove</Button>
										{:else}
											<span class="text-sm text-slate-500">Owner</span>
										{/if}
									</div>
								</TableBodyCell>
							</TableBodyRow>
						{/each}
					</TableBody>
				</Table>
			</Card>
		</TabItem>

		<TabItem title="Billing">
			<div class="space-y-6">
				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Current Plan</h3>
					</div>
					<div class="p-6">
						<div class="flex justify-between items-center mb-4">
							<div>
								<h4 class="text-lg font-medium text-slate-900 dark:text-slate-50">Professional Plan</h4>
								<p class="text-slate-600 dark:text-slate-400">Billed monthly</p>
							</div>
							<div class="text-right">
								<p class="text-2xl font-bold text-slate-900 dark:text-slate-50">$299/mo</p>
								<p class="text-sm text-slate-500">Per project</p>
							</div>
						</div>
						<div class="flex gap-2">
							<Button color="primary">Upgrade Plan</Button>
							<Button color="alternative">Change Billing</Button>
						</div>
					</div>
				</Card>

				<Card>
					<div class="p-6 pb-2">
						<h3 class="text-lg font-semibold">Payment Method</h3>
					</div>
					<div class="p-6">
						<div class="flex items-center gap-4 mb-4">
							<div class="p-2 bg-slate-100 dark:bg-slate-800 rounded">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
								</svg>
							</div>
							<div>
								<p class="font-medium text-slate-900 dark:text-slate-50">•••• •••• •••• 4242</p>
								<p class="text-sm text-slate-500">Expires 12/25</p>
							</div>
						</div>
						<div class="flex gap-2">
							<Button color="alternative">Update Payment Method</Button>
							<Button color="alternative">View Billing History</Button>
						</div>
					</div>
				</Card>
			</div>
		</TabItem>
	</Tabs>
</div>

<!-- Invite Team Member Modal -->
<Modal bind:open={showInviteModal} size="md" class="w-full">
	<form on:submit|preventDefault={inviteTeamMember}>
		<div class="space-y-4">
			<h3 class="text-lg font-medium text-slate-900 dark:text-slate-50 mb-4">Invite Team Member</h3>
			
			<div>
				<Label for="inviteEmail" class="mb-2">Email Address</Label>
				<Input id="inviteEmail" type="email" bind:value={inviteEmail} placeholder="colleague@company.com" required />
			</div>
			
			<div>
				<Label for="inviteRole" class="mb-2">Role</Label>
				<Select id="inviteRole" bind:value={inviteRole}>
					<option value="Reader">Reader - Can view projects and documents</option>
					<option value="Manager">Manager - Can manage projects and team</option>
				</Select>
			</div>
			
			<div class="flex gap-3 pt-4">
				<Button type="submit" color="primary">Send Invitation</Button>
				<Button type="button" color="alternative" on:click={() => showInviteModal = false}>Cancel</Button>
			</div>
		</div>
	</form>
</Modal>
