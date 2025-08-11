<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	const {
		children,
		class: className,
		// eslint-disable-next-line svelte/valid-compile
		...rest
	}: {} & HTMLAttributes<HTMLParagraphElement> = $props();
	const typography = 'leading-7 text-balance w-full [&:not(:first-child)]:mt-6';
</script>

<p class={cn(typography, className)} {...rest}>
	{@render children?.()}
</p>
