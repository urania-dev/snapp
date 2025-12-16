<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import { Button } from '$lib/components/ui/button';
	let {
		data,
		isAscending,
		isSorting,
		variant = 'link',
		...props
	}: {
		data: { id: string; label: string };
		isAscending: boolean;
		isSorting: boolean;
	} & ComponentProps<typeof Button> = $props();
</script>

<Button
	{variant}
	{...props}
	class={[
		'text-foreground-muted max-w-auto flex w-full justify-start gap-0 bg-transparent px-0! text-sm shadow-none hover:bg-transparent hover:text-foreground',
		props?.class
	]}
>
	<span>{data.label}</span>
	{#if isAscending}
		<ArrowUpIcon class={['ms-2 size-4!', (isSorting && 'opacity-100') || 'opacity-0']} />
	{:else}
		<ArrowDownIcon class={['ms-2 size-4!', (isSorting && 'opacity-100') || 'opacity-0']} />
	{/if}
</Button>
