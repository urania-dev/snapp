<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { Skeleton } from '$lib/components/ui/skeleton/index.js';
	import { cn } from '$lib/utils';

	let {
		children,
		class: className,
		ref = $bindable(null),
		showIcon = false, // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: {
		showIcon?: boolean;
	} & WithElementRef<HTMLAttributes<HTMLElement>> = $props();

	// Random width between 50% and 90%
	const width = `${Math.floor(Math.random() * 40) + 50}%`;
</script>

<div
	bind:this={ref}
	data-sidebar="menu-skeleton"
	class={cn('flex h-8 items-center gap-2 rounded-md px-2', className)}
	{...restProps}
>
	{#if showIcon}
		<Skeleton class="size-4 rounded-md" data-sidebar="menu-skeleton-icon" />
	{/if}
	<Skeleton
		class="h-4 max-w-[--skeleton-width] flex-1"
		data-sidebar="menu-skeleton-text"
		style="--skeleton-width: {width};"
	/>
	{@render children?.()}
</div>
