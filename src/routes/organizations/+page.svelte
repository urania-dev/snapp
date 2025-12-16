<script lang="ts">
	import type { TPermissions } from '$lib/schemas/host.schema.js';

	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import WarningIcon from '@lucide/svelte/icons/triangle-alert';
	import Configuration from '$lib/components/blocks/organizations/configuration.svelte';
	import CreateOrganization from '$lib/components/blocks/organizations/create-organization.svelte';
	import OrganizationDetails from '$lib/components/blocks/organizations/organization-details.svelte';
	import { columns } from '$lib/components/blocks/organizations/organizations.columns.svelte';
	import TableOrganization from '$lib/components/blocks/organizations/table-organization.svelte';
	import * as Item from '$lib/components/ui/item';
	import { m } from '$lib/paraglide/messages';

	const { data } = $props();

	let selected = $state<null | string>(null);
	let showCreate = $state(false);
	let showDelete = $state(false);
	const selectedOrg = $derived(
		(selected && data?.organizations?.find?.((o) => o.id === selected)) || undefined
	);

	type PermissionRecord = Record<string, TPermissions>;
</script>

<div class="@container flex w-full grow flex-col">
	<div class="flex h-14 w-full items-center gap-4 border-b p-4">
		<BuildingIcon class="size-8! fill-secondary/50" />
		<h1 class="text-2xl font-bold">{m.organizations()}</h1>
	</div>
	<div class="flex h-full w-full flex-col divide-y @5xl:flex-row @5xl:divide-x @5xl:divide-y-0">
		<div class="flex h-full w-full flex-col divide-y">
			<div class="flex flex-col p-4">
				<Item.Root variant="muted" class="p-2">
					<Item.Content class="gap-2">
						<Item.Description class="text-balance">{m?.organizations_helper?.()}</Item.Description>
						<div class="flex items-center gap-2 text-ring">
							<WarningIcon class="size-4!" />
							<Item.Description class="@xl:text-xs  font-semibold text-balance text-ring"
								>{m.organizations_helper_two()}</Item.Description
							>
						</div>
					</Item.Content>
				</Item.Root>
			</div>
			<TableOrganization
				data={data.organizations}
				{columns}
				bind:showCreate
				bind:showDelete
				bind:selected
			/>

			<div class="flex min-h-max flex-col p-4 @5xl:grow">
				<OrganizationDetails
					logo={selectedOrg?.logo || ''}
					dataPermissions={(selectedOrg?.permissions || {}) as PermissionRecord}
					roles={selectedOrg?.roles || []}
					invitations={selectedOrg?.invitations || []}
					members={selectedOrg?.members || []}
					teams={selectedOrg?.teams || []}
					organizationId={selectedOrg?.id || 'org-not-selected'}
					host={data.host}
					{selected}
				/>
			</div>
		</div>
		<div class="flex w-full flex-col p-4 @5xl:max-w-md">
			<Configuration
				config={(selected && data.rawConfigs.find((h) => h.host === selected)?.raw) || ''}
			/>
		</div>
	</div>
</div>

<CreateOrganization bind:showCreate />
