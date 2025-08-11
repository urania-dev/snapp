<script lang="ts">
	import { buttonVariants, type Props } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { Pagination as PaginationPrimitive } from 'bits-ui';

	let {
		children,
		class: className,
		isActive = false,
		page,
		ref = $bindable(null),
		size = 'icon', // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: {
		isActive: boolean;
	} & PaginationPrimitive.PageProps &
		Props = $props();
</script>

{#snippet Fallback()}
	{page.value}
{/snippet}

<PaginationPrimitive.Page
	bind:ref
	{page}
	class={cn(
		buttonVariants({
			size,
			variant: isActive ? 'outline' : 'ghost'
		}),
		className
	)}
	children={children || Fallback}
	{...restProps}
/>
