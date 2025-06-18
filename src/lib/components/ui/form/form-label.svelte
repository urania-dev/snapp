<script lang="ts">
	import type { WithoutChild } from 'bits-ui';

	import { Label } from '$lib/components/ui/label/index.js';
	import { cn } from '$lib/utils';
	import * as FormPrimitive from 'formsnap';

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChild<FormPrimitive.LabelProps> = $props();
</script>

<FormPrimitive.Label {...restProps} bind:ref>
	{#snippet child({ props })}
		<Label {...props} class={cn('data-[fs-error]:text-destructive', className)}>
			{@render children?.()}
		</Label>
	{/snippet}
</FormPrimitive.Label>
