<script lang="ts">
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import * as Item from '$lib/components/ui/item';
	import { getLocale } from '$lib/paraglide/runtime';
	const {
		class: classes,
		item,
		labelClass
	}: {
		class?: string;
		item: { helper?: string; icon?: typeof ActivityIcon; label?: string; number: number | string };
		labelClass?: string;
	} = $props();
</script>

<Item.Root variant="muted" class="gap-2 w-full whitespace-nowrap flex-nowrap">
	{#if item?.icon}
		<Item.Media variant="icon" class="size-6! bg-transparent! border-none">
			<item.icon class="size-6! not-dark:text-primary dark:text-sidebar-primary" />
		</Item.Media>
	{/if}
	<Item.Content class={['w-full', classes]}>
		<Item.Title class="w-full text-nowrap"
			><span class={['empty:hidden w-full text-start', labelClass]}>{item.label}</span>
			{typeof item.number === 'string'
				? item.number
				: new Intl.NumberFormat(getLocale(), {
						compactDisplay: 'short',
						notation: 'compact'
					}).format(item.number)}</Item.Title
		>
		<Item.Description class="text-start">{item?.helper}</Item.Description>
	</Item.Content>
</Item.Root>
