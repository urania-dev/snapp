<script lang="ts">
	import { cn } from '$lib/utils';
	import { Command as CommandPrimitive } from 'bits-ui';

	let {
		children,
		class: className,
		heading,
		ref = $bindable(null),
		...restProps
	}: {
		heading?: string;
	} & CommandPrimitive.GroupProps = $props();
</script>

<CommandPrimitive.Group
	class={cn('overflow-hidden p-1 text-foreground', className)}
	bind:ref
	{...restProps}
>
	{#if heading}
		<CommandPrimitive.GroupHeading class="px-2 py-1.5 text-xs font-medium text-muted-foreground">
			{heading}
		</CommandPrimitive.GroupHeading>
	{/if}
	<CommandPrimitive.GroupItems {children} />
</CommandPrimitive.Group>
