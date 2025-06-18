<script lang="ts">
	import { cn } from '$lib/utils';
	import { Checkbox as CheckboxPrimitive, type WithoutChildrenOrChild } from 'bits-ui';

	let {
		checked = $bindable(false),
		class: className,
		indeterminate = $bindable(false),
		ref = $bindable(null),
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	class={cn(
		'peer box-content h-5 w-5 shrink-0 rounded-sm border border-primary p-0 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[disabled=true]:cursor-not-allowed data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[disabled=true]:opacity-50',
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div class="flex h-5 w-5 items-center justify-center text-current">
			{#if indeterminate}
				<i class="ph ph-minus text-[14px]"></i>
			{:else}
				<i class={cn('ph-bold ph-check text-[14px]', !checked && 'text-transparent')}></i>
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
