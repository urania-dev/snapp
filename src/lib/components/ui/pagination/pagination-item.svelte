<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLLiAttributes } from 'svelte/elements';

	let {
		children,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLLiAttributes> = $props();
</script>

<li bind:this={ref} {...restProps}>
	{@render children?.()}
</li>
