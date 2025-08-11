<script lang="ts">
	import { cn } from '$lib/utils';
	import { Dialog as SheetPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: SheetPrimitive.DescriptionProps = $props();
</script>

<SheetPrimitive.Description
	bind:ref
	class={cn('text-sm text-muted-foreground', className)}
	{...restProps}
/>
