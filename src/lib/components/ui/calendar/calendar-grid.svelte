<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Calendar as CalendarPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: CalendarPrimitive.GridProps = $props();
</script>

<CalendarPrimitive.Grid
	bind:ref
	class={cn('w-full border-collapse space-y-1', className)}
	{...restProps}
/>
