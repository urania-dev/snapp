<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { cn } from '$lib/utils';
	import { PinInput as InputOTPPrimitive } from 'bits-ui';

	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(''), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: ComponentProps<typeof InputOTPPrimitive.Root> = $props();
</script>

<InputOTPPrimitive.Root
	bind:ref
	bind:value
	class={cn(
		'flex items-center gap-2 has-[:disabled]:opacity-50 [&_input]:disabled:cursor-not-allowed',
		className
	)}
	{...restProps}
/>
