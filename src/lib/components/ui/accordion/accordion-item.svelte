<script lang="ts">
	import { cn } from '$lib/utils';
	import { Accordion as AccordionPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: AccordionPrimitive.ItemProps = $props();
</script>

<AccordionPrimitive.Item bind:ref class={cn('border-b', className)} {...restProps} />
