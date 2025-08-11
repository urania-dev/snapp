<script lang="ts">
	import { cn } from '$lib/utils';
	import { Command as CommandPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: CommandPrimitive.SeparatorProps = $props();
</script>

<CommandPrimitive.Separator class={cn('-mx-1 h-px bg-border', className)} bind:ref {...restProps} />
