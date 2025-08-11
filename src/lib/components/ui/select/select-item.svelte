<script lang="ts">
	import { cn } from '$lib/utils';
	import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui';

	let {
		children: childrenProp,
		class: className,
		hideIcon = false,
		label,
		ref = $bindable(null),
		value, // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: { hideIcon?: boolean } & WithoutChild<SelectPrimitive.ItemProps> = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	{value}
	class={cn(
		`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 ${!hideIcon ? 'pl-8' : 'pl-2'} pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50`,
		className
	)}
	{...restProps}
>
	{#snippet children({ highlighted, selected })}
		<span class="absolute left-2 flex size-3.5 items-center justify-center">
			{#if selected}
				<i class="ph ph-check text-[14px]" class:hidden={hideIcon}></i>
			{/if}
		</span>
		{#if childrenProp}
			{@render childrenProp({ highlighted, selected })}
		{:else}
			{label || value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>
