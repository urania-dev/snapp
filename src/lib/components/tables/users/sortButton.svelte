<script lang="ts">
	import type { SortingState } from '@tanstack/table-core';
	import type { ComponentProps } from 'svelte';

	import { Button } from '$lib/components/ui/button';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { queryParameters } from 'sveltekit-search-params';

	let {
		data,
		variant = 'default',
		...props
	}: { data: { id: string; label: string } } & ComponentProps<typeof Button> = $props();

	const params = queryParameters({
		sorting: {
			decode: (string: null | string) => (string ? JSON.parse(string) : []) as SortingState,
			defaultValue: [],
			encode: (state: SortingState) => JSON.stringify(state)
		},
		tag: true
	});

	const isSorting = $derived(params.sorting.find((s) => s.id === data.id) !== undefined);
	const isAscending = $derived(params.sorting.find((s) => s.id === data.id)?.desc === false);
	const i18n = getTranslations();
</script>

<Button
	{variant}
	{...props}
	class="text-foreground-muted max-w-auto flex w-full justify-center gap-0 bg-transparent px-0 shadow-none hover:bg-transparent hover:text-foreground"
>
	<span>
		{i18n.t(data.label)}
	</span>

	<i
		class="ph ph-{isAscending === true ? 'arrow-up' : 'arrow-down'} size-4 transition-all {isSorting
			? 'ms-2 opacity-100'
			: 'w-0 opacity-0'}"
	></i>
</Button>
