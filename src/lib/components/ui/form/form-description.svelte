<script lang="ts">
	import type { WithoutChild } from 'bits-ui';

	import { cn } from '$lib/utils';
	import * as FormPrimitive from 'formsnap';

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChild<FormPrimitive.DescriptionProps> = $props();
</script>

<FormPrimitive.Description
	bind:ref
	class={cn('text-sm text-muted-foreground', className)}
	{...restProps}
/>
