<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	const {
		children,
		class: className, // eslint-disable-next-line svelte/valid-compile
		...rest
	}: {} & HTMLAttributes<HTMLUListElement> = $props();

	const typography = 'my-6 ml-6 list-none [&>li]:mt-2';
</script>

<ul class={cn(typography, className)} {...rest}>
	{@render children?.()}
</ul>
