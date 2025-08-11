<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		children,
		class: className,
		ref = $bindable(null),
		// eslint-disable-next-line svelte/valid-compile
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLUListElement>> = $props();
</script>

<ul
	bind:this={ref}
	data-sidebar="menu-sub"
	class={cn(
		'mx-3.5 flex min-w-0 translate-x-px list-none flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5',
		'group-data-[collapsible=icon]:hidden',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</ul>
