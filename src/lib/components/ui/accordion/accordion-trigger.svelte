<script lang="ts">
	import { cn } from '$lib/utils';
	import { Accordion as AccordionPrimitive, type WithoutChild } from 'bits-ui';

	let {
		children,
		class: className,
		level = 3,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: {
		level?: AccordionPrimitive.HeaderProps['level'];
	} & WithoutChild<AccordionPrimitive.TriggerProps> = $props();
</script>

<AccordionPrimitive.Header {level} class="flex">
	<AccordionPrimitive.Trigger
		bind:ref
		class={cn(
			'flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>i]:rotate-180',
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<i class="ph ph-caret-down shrink-0 text-[20px] transition-transform duration-200"></i>
	</AccordionPrimitive.Trigger>
</AccordionPrimitive.Header>
