<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		children,
		ref = $bindable(null), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div bind:this={ref} role="separator" {...restProps}>
	{#if children}
		{@render children?.()}
	{:else}
		<i class="ph ph-dot text-[24px]"></i>
	{/if}
</div>
