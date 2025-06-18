<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Pagination as PaginationPrimitive } from 'bits-ui';

	let {
		class: className,
		count = 0,
		page = $bindable(1),
		perPage = 10,
		ref = $bindable(null),
		siblingCount = 1,
		...restProps
	}: PaginationPrimitive.RootProps = $props();
</script>

<PaginationPrimitive.Root
	bind:ref
	class={cn('mx-auto flex w-full flex-col items-center', className)}
	{count}
	{perPage}
	{siblingCount}
	bind:page
	{...restProps}
/>
