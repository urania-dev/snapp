<script lang="ts">
	import { cn } from '$lib/utils';
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: DropdownMenuPrimitive.SeparatorProps = $props();
</script>

<DropdownMenuPrimitive.Separator
	bind:ref
	class={cn('-mx-1 my-1 h-px bg-muted', className)}
	{...restProps}
/>
