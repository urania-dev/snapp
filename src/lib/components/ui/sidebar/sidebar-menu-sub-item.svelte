<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		children,
		ref = $bindable(null),
		// eslint-disable-next-line svelte/valid-compile
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLLIElement>> = $props();
</script>

<li bind:this={ref} data-sidebar="menu-sub-item" class="list-none" {...restProps}>
	{@render children?.()}
</li>
