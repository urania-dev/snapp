<script lang="ts">
	import type { HTMLBlockquoteAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	const {
		children,
		class: className, // eslint-disable-next-line svelte/valid-compile
		...rest
	}: {} & HTMLBlockquoteAttributes = $props();
	const typography = 'mt-6 border-l-2 pl-6 italic';
</script>

<blockquote class={cn(typography, className)} {...rest}>
	{@render children?.()}
</blockquote>
