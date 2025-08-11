<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	const {
		children,
		class: className, // eslint-disable-next-line svelte/valid-compile
		...rest
	}: {} & HTMLAttributes<HTMLHeadingElement> = $props();

	const typography = 'scroll-m-20 text-xl font-semibold tracking-tight';
</script>

<h4 class={cn(typography, className)} {...rest}>
	{@render children?.()}
</h4>
