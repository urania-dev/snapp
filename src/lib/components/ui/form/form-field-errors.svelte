<script lang="ts">
	import type { WithoutChild } from 'bits-ui';

	import { getTranslations } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import * as FormPrimitive from 'formsnap';

	let {
		children: childrenProp,
		class: className,
		errorClasses,
		ref = $bindable(null),
		...restProps
	}: {
		errorClasses?: null | string | undefined;
	} & WithoutChild<FormPrimitive.FieldErrorsProps> = $props();

	const i18n = getTranslations();
</script>

<FormPrimitive.FieldErrors
	bind:ref
	class={cn('px-2 text-xs font-medium text-destructive', className)}
	{...restProps}
>
	{#snippet children({ errorProps, errors })}
		{#if childrenProp}
			{@render childrenProp({ errorProps, errors })}
		{:else}
			{#each errors as error, idx (idx)}
				<div {...errorProps} class={cn(errorClasses)}>{i18n.t(error)}</div>
			{/each}
		{/if}
	{/snippet}
</FormPrimitive.FieldErrors>
