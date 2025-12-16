<script lang="ts">
	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import CreateTeam from '$lib/components/blocks/organizations/create-team.svelte';
	import TableTeams from '$lib/components/blocks/organizations/table-teams.svelte';
	import { columns } from '$lib/components/blocks/organizations/teams.columns.svelte';
	import { m } from '$lib/paraglide/messages';

	const { data } = $props();

	let selected = $state<null | string>(null);
	let showCreate = $state(false);
	let showDelete = $state(false);
</script>

<div class="@container flex w-full grow flex-col">
	<div class="flex h-14 w-full items-center gap-4 border-b p-4">
		<BuildingIcon class="size-8! fill-secondary/50" />
		<h1 class="text-2xl font-bold">{m.teams()}</h1>
	</div>
	<div class="flex h-full w-full flex-col divide-y @5xl:flex-row @5xl:divide-x @5xl:divide-y-0">
		<div class="flex h-full w-full flex-col divide-y">
			<TableTeams
				limit={data.limit}
				columnVisibility={data.columnVisibility}
				data={data?.teams}
				{columns}
				bind:showCreate
				bind:showDelete
				bind:selected
			/>
		</div>
	</div>
</div>
{#if data.activeOrganization}
	<CreateTeam bind:showCreate organizationId={data.activeOrganization.id} roles={data.roles} />
{/if}
