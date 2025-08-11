<script lang="ts">
	import type { WithElementRef, WithoutChildren } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		ref = $bindable(null),
		// eslint-disable-next-line svelte/valid-compile
		...restProps
	}: WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<div
	bind:this={ref}
	class={cn('animate-pulse rounded-md bg-muted', className)}
	{...restProps}
></div>
