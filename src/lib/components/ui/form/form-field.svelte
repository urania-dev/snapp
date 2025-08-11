<script lang="ts" module>
	import type { FormPath as _FormPath } from 'sveltekit-superforms';
	type T = Record<string, unknown>;
	type U = _FormPath<T>;
</script>

<script lang="ts" generics="T extends Record<string, unknown>, U extends _FormPath<T>">
	import type { WithElementRef, WithoutChildren } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';
	import * as FormPrimitive from 'formsnap';

	let {
		children: childrenProp,
		class: className,
		form,
		name,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: FormPrimitive.FieldProps<T, U> &
		WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> = $props();
</script>

<FormPrimitive.Field {form} {name}>
	{#snippet children({ constraints, errors, tainted, value })}
		<div bind:this={ref} class={cn('space-y-2', className)} {...restProps}>
			{@render childrenProp?.({ constraints, errors, tainted, value: value as T[U] })}
		</div>
	{/snippet}
</FormPrimitive.Field>
