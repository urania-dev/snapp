<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Calendar as CalendarPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: CalendarPrimitive.HeadingProps = $props();
</script>

<CalendarPrimitive.Heading bind:ref class={cn('text-sm font-medium', className)} {...restProps} />
