<script lang="ts">
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils';
	import { DropdownMenu as DropdownMenuPrimitive, type WithoutChildrenOrChild } from 'bits-ui';

	let {
		checked = $bindable(false),
		children: childrenProp,
		class: className,
		indeterminate = $bindable(false),
		ref = $bindable(null),
		...restProps
	}: {
		children?: Snippet;
	} & WithoutChildrenOrChild<DropdownMenuPrimitive.CheckboxItemProps> = $props();
</script>

<DropdownMenuPrimitive.CheckboxItem
	bind:ref
	bind:checked
	bind:indeterminate
	class={cn(
		'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<span class="absolute left-2 flex size-3.5 items-center justify-center">
			{#if indeterminate}
				<i class="ph ph-minus text-[20px]"></i>
			{:else}
				<i class={cn('ph ph-check text-[20px]', !checked && 'text-transparent')}></i>
			{/if}
		</span>
		{@render childrenProp?.()}
	{/snippet}
</DropdownMenuPrimitive.CheckboxItem>
