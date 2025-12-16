<script lang="ts">
	import type { TPermissions } from '$lib/schemas/host.schema';
	import type * as schema from '$lib/server/db/auth-schema';

	import BuildingIcon from '@lucide/svelte/icons/building';
	import GroupIcon from '@lucide/svelte/icons/group';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tabs from '$lib/components/ui/tabs';
	import { m } from '$lib/paraglide/messages';
	import { fade } from 'svelte/transition';

	import type { Organization } from './organizations.columns.svelte';

	import CreateTeam from './create-team.svelte';
	import PermissionRoles from './permission-roles.svelte';

	let {
		dataPermissions,
		member,
		roles,
		selected,
		teams
	}: {
		dataPermissions: Record<string, TPermissions>;
		member?: typeof schema.member.$inferSelect;
		roles: (typeof schema.organizationRole.$inferSelect)[];
		selected: null | string;
		teams: Organization['teams'];
	} = $props();
	let tab = $state<string>('none');

	const isEmpty = $derived(teams.length === 0);
	let showCreateTeam = $state(false);
</script>

<Tabs.Root class="h-full min-h-45 @2xl:flex-row!" bind:value={tab}>
	{#key selected}
		<div class="h-full w-full @2xl:flex-row! flex flex-col" in:fade|global>
			{#if selected !== null}
				<Select.Root type="single" bind:value={tab}>
					<Select.Trigger class="w-full @2xl:hidden">{m.select()}</Select.Trigger>
					<Select.Content align="start">
						{#each teams as team (team)}
							<Select.Item value={team.id}>{team.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			{/if}
			<Tabs.List
				class="hidden h-full w-full max-w-[30%] flex-col {isEmpty
					? 'items-center justify-start'
					: 'items-start justify-start gap-1'} rounded-none {selected !== null ? '@2xl:flex' : ''}"
			>
				<Button
					variant="outline"
					class="w-full"
					onclick={() => {
						showCreateTeam = !showCreateTeam;
						tab = 'none';
					}}>{m.teams_create_new()}</Button
				>
				{#each teams as team (team.id)}
					<Tabs.Trigger
						class={buttonVariants({ class: 'h-10 max-h-10 w-full', variant: 'outline' })}
						value={team.id}>{team.name}</Tabs.Trigger
					>
				{/each}
			</Tabs.List>
			{#each teams as team (team.id)}
				<Tabs.Content id={team.id} value={team.id} class="divide-y"
					><div class="flex w-full divide-x">
						<div class="p-4 flex w-full items-center h-10">
							<h3 class="text-lg font-semibold">{team.name}</h3>
						</div>
						<div class="p-4 flex items-center h-10 gap-4">
							<p class="font-medium">{m.members()}</p>
							<Badge class="w-[5ch]">{team.memberCount}</Badge>
						</div>
					</div>
					<PermissionRoles {dataPermissions} {roles} {team} {member} />
				</Tabs.Content>
			{/each}

			<Tabs.Content id="none" value="none" class="flex h-full flex-col p-0">
				{#if selected && isEmpty}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<GroupIcon />
							</Empty.Media>
							<Empty.Title>{m.teams()}</Empty.Title>
							<Empty.Description>{m.teams_create_new_helper()}</Empty.Description>
						</Empty.Header>
						<Empty.Content>
							<Button onclick={() => (showCreateTeam = true)}>{m.teams_create_new()}</Button>
						</Empty.Content>
					</Empty.Root>
				{:else if selected}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<GroupIcon />
							</Empty.Media>
							<Empty.Title>{m.teams()}</Empty.Title>
							<Empty.Description>{m.teams_select_one()}</Empty.Description>
						</Empty.Header>
					</Empty.Root>
				{:else}
					<Empty.Root>
						<Empty.Header>
							<Empty.Media variant="icon">
								<BuildingIcon />
							</Empty.Media>
							<Empty.Title>{m.organization()}</Empty.Title>
							<Empty.Description>{m.organizations_select_one()}</Empty.Description>
						</Empty.Header>
					</Empty.Root>
				{/if}
			</Tabs.Content>
		</div>
	{/key}
</Tabs.Root>
{#if selected}
	<CreateTeam organizationId={selected} {roles} bind:showCreate={showCreateTeam} />
{/if}
