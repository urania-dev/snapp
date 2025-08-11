<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		children,
		class: className,
		idx = 0,
		ref = $bindable(null),
		// eslint-disable-next-line svelte/valid-compile
		...restProps
	}: { idx?: number | string } & WithElementRef<HTMLAttributes<HTMLTableRowElement>> = $props();
</script>

<tr
	bind:this={ref}
	class={cn(
		'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
		className
	)}
	data-idx={idx}
	{...restProps}
>
	{@render children?.()}
</tr>
