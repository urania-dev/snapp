<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';
	import type { TPermissions } from '$lib/schemas/host.schema';
	import type * as schema from '$lib/server/db/auth-schema';

	import { page } from '$app/state';
	import * as Item from '$lib/components/ui/item';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { m } from '$lib/paraglide/messages';

	import type { Organization } from './organizations.columns.svelte';

	import OrganizationInvitations from './organization-invitations.svelte';
	import OrganizationInviteUser from './organization-invite-user.svelte';
	import OrganizationLogoUpload from './organization-logo-upload.svelte';
	import OrganizationTeams from './organization-teams.svelte';

	let showInviteUser = $state(false);
	let {
		dataPermissions,
		host,
		invitations,
		logo,
		members,
		organizationId,
		roles,
		selected,
		teams
	}: {
		dataPermissions: Record<string, TPermissions>;
		host: THost;
		invitations: Organization['invitations'];
		logo?: string;
		members: Organization['members'];
		organizationId: string;
		roles: (typeof schema.organizationRole.$inferSelect)[];
		selected: null | string;
		teams: Organization['teams'];
	} = $props();

	const member = $derived(members.find((m) => m.userId === page.data.user.id));
</script>

<div class="flex w-full grow flex-col gap-4 @lg:mb-auto">
	<Item.Root variant="muted" class="m-0 flex h-full min-h-66 gap-0 border border-border p-0">
		<Tabs.Root value="teams" class="h-full w-full gap-0">
			<Item.Header class="max-h-12">
				<Tabs.List
					class="h-12 max-h-12 w-full justify-start rounded-none border-b bg-transparent p-4 px-2"
				>
					<Tabs.Trigger class="h-8 max-w-max" value="teams">{m.teams()}</Tabs.Trigger>
					<Tabs.Trigger class="h-8 max-w-max" value="invitations">{m.invitations()}</Tabs.Trigger>
					<Tabs.Trigger class="h-8 max-w-max" value="logo">{m.logo()}</Tabs.Trigger>
				</Tabs.List>
			</Item.Header>
			<Tabs.Content value="teams">
				<OrganizationTeams {selected} {teams} {dataPermissions} {roles} {member} />
			</Tabs.Content>
			<Tabs.Content value="invitations">
				<OrganizationInvitations bind:showInviteUser {invitations} {selected} />
			</Tabs.Content>
			<Tabs.Content value="logo" class="p-4">
				{#if selected}
					<OrganizationLogoUpload src={logo} {organizationId} />
				{/if}
			</Tabs.Content>
		</Tabs.Root>
	</Item.Root>
</div>
<OrganizationInviteUser {organizationId} {members} {host} bind:showInviteUser />
