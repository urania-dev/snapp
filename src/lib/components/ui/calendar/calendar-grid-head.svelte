<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Calendar as CalendarPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: CalendarPrimitive.GridHeadProps = $props();
</script>

<CalendarPrimitive.GridHead bind:ref class={cn(className)} {...restProps} />
