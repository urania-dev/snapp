<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Input } from '$lib/components/ui/input/index.js';
	import { cn } from '$lib/utils';

	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(''), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: ComponentProps<typeof Input> = $props();
</script>

<Input
	bind:ref
	bind:value
	data-sidebar="input"
	class={cn(
		'h-8 w-full bg-background shadow-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
		className
	)}
	{...restProps}
/>
