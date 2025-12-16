<script lang="ts">
	import LinkIcon from '@lucide/svelte/icons/link';
	import TableUrls from '$lib/components/blocks/urls/urls-table.svelte';
	import { columns } from '$lib/components/blocks/urls/urls.columns.svelte.js';
	import { m } from '$lib/paraglide/messages';

	const { data } = $props();

	let selected = $state<null | string>(null);
	let showDelete = $state(false);
</script>

<div class="@container flex w-full grow flex-col">
	<div class="flex h-14 w-full items-center gap-4 border-b p-4">
		<LinkIcon class="size-8! fill-secondary/50" />
		<h1 class="text-2xl font-bold">{m.url_list()}</h1>
	</div>
	<div class="flex h-full w-full flex-col divide-y @5xl:flex-row @5xl:divide-x @5xl:divide-y-0">
		<div class="flex h-full w-full flex-col divide-y">
			<TableUrls
				data={data.urls}
				rowCount={data.count}
				limit={data.limit}
				{columns}
				columnVisibility={data.columnVisibility}
				bind:showDelete
				bind:selected
				tagList={data.tags}
			/>
		</div>
	</div>
</div>
