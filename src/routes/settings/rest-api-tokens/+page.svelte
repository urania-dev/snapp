<script>
	import BracesIcon from '@lucide/svelte/icons/braces';
	import WarningIcon from '@lucide/svelte/icons/triangle-alert';
	import { columns } from '$lib/components/blocks/apikeys/apikey.columns.svelte';
	import CreateApiKey from '$lib/components/blocks/apikeys/create-api-key.svelte';
	import ApiKeysTable from '$lib/components/blocks/apikeys/table.svelte';
	import * as Item from '$lib/components/ui/item';
	import { m } from '$lib/paraglide/messages';
	const { data } = $props();
	let showCreate = $state(false);
	let showDelete = $state(false);
</script>

<div class="@container flex h-full w-full divide-y flex-col">
	<div class="flex h-14 w-full items-center p-4">
		<BracesIcon class="size-8! fill-secondary/50" />
		<h1 class="text-2xl font-bold">{m.rest_api_tokens()}</h1>
	</div>
	<div class="flex flex-col divide-y grow">
		<div class="p-4">
			<Item.Root variant="muted" class="p-2">
				<Item.Content class="gap-2">
					<Item.Description class="text-balance">{m.rest_api_tokens_helper()}</Item.Description>
					<div class="flex items-center gap-2 text-ring">
						<WarningIcon class="size-4!" />
						<Item.Description class="@xl:text-xs  font-semibold text-balance text-ring"
							>{m.rest_api_tokens_helper_two()}</Item.Description
						>
					</div>
				</Item.Content>
			</Item.Root>
		</div>
		<ApiKeysTable
			limit={data.limit}
			{columns}
			data={data.apikeys}
			bind:showCreate
			bind:showDelete
		/>
	</div>
</div>
<CreateApiKey host={data.host} bind:showCreate />
