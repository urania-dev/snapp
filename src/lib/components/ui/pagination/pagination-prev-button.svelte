<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { Pagination as PaginationPrimitive } from 'bits-ui';

	let {
		children,
		class: className,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: PaginationPrimitive.PrevButtonProps = $props();
</script>

{#snippet Fallback()}
	<i class="ph ph-caret-left text-[20px]"></i>
	<span>Previous</span>
{/snippet}

<PaginationPrimitive.PrevButton
	bind:ref
	class={cn(
		buttonVariants({
			class: 'gap-1 pl-2.5',
			variant: 'ghost'
		}),
		className
	)}
	children={children || Fallback}
	{...restProps}
/>
