<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';
	import { type WithElementRef } from 'bits-ui';

	let {
		children,
		class: className,
		inset,
		ref = $bindable(null),
		...restProps
	}: {
		inset?: boolean;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	class={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)}
	{...restProps}
>
	{@render children?.()}
</div>
