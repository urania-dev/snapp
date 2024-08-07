<script lang="ts">
	import { hover } from '$lib/utils/hover';
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';

	let show_tooltip = $state(false);

	let { message, children }: { children?: Snippet; message: string } = $props();
</script>

<div
	class="relative flex h-full w-full items-center justify-center"
	use:hover={{
		enter: () => {
			show_tooltip = true;
		},
		exit: () => {
			show_tooltip = false;
		},
		click: () => {
			show_tooltip = !show_tooltip;
		}
	}}
>
	{#if show_tooltip}
		<div
			class="absolute bottom-8 z-[50] whitespace-nowrap rounded border border-slate-500/50 bg-neutral-50 p-2 text-sm font-semibold tracking-wide dark:bg-neutral-950"
			transition:fly={{ y: 5 }}
		>
			{message}
		</div>
	{/if}

	{@render children?.()}
</div>
