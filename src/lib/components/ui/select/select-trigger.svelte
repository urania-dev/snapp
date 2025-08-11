<script lang="ts">
	import { cn } from '$lib/utils';
	import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui';

	let {
		children,
		class: className,
		ref = $bindable(null),
		showArrow = true,
		...restProps
	}: { showArrow?: boolean } & WithoutChild<SelectPrimitive.TriggerProps> = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	class={cn(
		'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground [&>span]:line-clamp-1',
		className
	)}
	{...restProps}
>
	{@render children?.()}
	{#if showArrow && restProps.disabled}
		<i class="ph ph-lock text-[20px]"></i>
	{:else if showArrow}
		<i class="ph ph-caret-down text-[20px]"></i>
	{/if}
</SelectPrimitive.Trigger>
