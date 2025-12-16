<script lang="ts">
	import ClockIcon from '@lucide/svelte/icons/clock';
	import GroupIcon from '@lucide/svelte/icons/group';
	import NumberCard from '$lib/components/blocks/commons/number-card.svelte';
	import PermissionRoles from '$lib/components/blocks/organizations/permission-roles.svelte';
	import UrlsTable from '$lib/components/blocks/urls/urls-table.svelte';
	import { columns } from '$lib/components/blocks/urls/urls.columns.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	const { data } = $props();

	let showDelete = $state(false);
	let selected = $state<null | string>(null);
</script>

<div class="@container flex w-full grow flex-col">
	<div class="flex h-14 w-full items-center gap-4 border-b">
		<div class="p-4 flex gap-4 items-center">
			<GroupIcon class="size-8! fill-secondary/50" />
			<h1 class="text-2xl leading-none font-bold">{m.team()}</h1>
		</div>
	</div>
	<div
		class="flex flex-col @4xl:grid @4xl:grid-cols-6 grid-cols-1 @4xl:divide-y-0 grow @4xl:divide-x divide-y"
	>
		<div class="flex w-full @xl:col-span-2 @container/column flex-col divide-y">
			<div class="p-4 flex gap-4 items-center">
				<Avatar.Root class="size-20! rounded-md!">
					<Avatar.Image class="size-20! rounded-md!" src={data.activeOrganization?.logo} />
					<Avatar.Fallback
						class="size-20! bg-secondary/20 border-secondary border-2 uppercase rounded-md! text-2xl font-semibold"
						>{data.team.name.slice(0, 1)}</Avatar.Fallback
					>
				</Avatar.Root>
				<div class="flex flex-col gap-1">
					<h2 class="text-2xl font-semibold leading-none">{data.team.name}</h2>
					<p class="text-base font-medium">{data.team.organizationId}</p>
				</div>
			</div>
			<div
				class="flex w-full flex-col @md/column:flex-row @md/column:divide-x divide-y @md/column:divide-y-0"
			>
				<div class="p-4 flex grow @md/column:w-1/2">
					<NumberCard
						item={{
							helper: m.registered(),
							icon: ClockIcon,
							label: data.team.createdAt?.toLocaleDateString(getLocale(), {
								dateStyle: 'medium'
							}),
							number: ''
						}}
					/>
				</div>
				<div class="p-4 flex grow @md/column:w-1/2">
					<NumberCard
						item={{
							helper: m.total_urls(),
							icon: ClockIcon,
							label: m.total(),
							number: data.urlCount
						}}
					/>
				</div>
			</div>
			<PermissionRoles
				dataPermissions={data.permissions}
				roles={data.roles}
				team={data.team}
				member={data.user.member}
			/>
		</div>

		<div class="flex @xl:col-span-4 w-full flex-col h-full grow">
			<UrlsTable
				data={data.teamUrls.map((u) => ({
					...u,
					...u.url,
					id: u.url.id,
					tags: u.url.tags?.filter((t) => !!t) || []
				}))}
				rowCount={data.urlCount}
				limit={data.limit}
				{columns}
				columnVisibility={data.columnVisibility}
				bind:showDelete
				bind:selected
				hideCreate
				tagList={data.tags}
			/>
		</div>
	</div>
</div>
