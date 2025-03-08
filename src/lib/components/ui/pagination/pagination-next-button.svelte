<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { Pagination as PaginationPrimitive } from 'bits-ui';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: PaginationPrimitive.NextButtonProps = $props();
</script>

{#snippet Fallback()}
	<span>Next</span>
	<i class="ph ph-caret-right text-[20px]"></i>
{/snippet}

<PaginationPrimitive.NextButton
	bind:ref
	class={cn(
		buttonVariants({
			class: 'gap-1 pr-2.5',
			variant: 'ghost'
		}),
		className
	)}
	children={children || Fallback}
	{...restProps}
/>
