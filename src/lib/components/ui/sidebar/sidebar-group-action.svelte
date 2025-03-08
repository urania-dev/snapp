<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		child,
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
	} & WithElementRef<HTMLButtonAttributes> = $props();

	const propObj = $derived({
		class: cn(
			'text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-none transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0',
			// Increases the hit area of the button on mobile.
			'after:absolute after:-inset-2 after:md:hidden',
			'group-data-[collapsible=icon]:hidden',
			className
		),
		'data-sidebar': 'group-action',
		...restProps
	});
</script>

{#if child}
	{@render child({ props: propObj })}
{:else}
	<button bind:this={ref} {...propObj}>
		{@render children?.()}
	</button>
{/if}
