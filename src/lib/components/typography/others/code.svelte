<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	const { children, class: className, ...rest }: {} & HTMLAttributes<HTMLElement> = $props();

	const typography =
		'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold';
</script>

<code class={cn(typography, className)} {...rest}>
	{@render children?.()}
</code>
