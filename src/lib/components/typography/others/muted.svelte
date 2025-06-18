<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	const { children, class: className, ...rest }: {} & HTMLAttributes<HTMLSpanElement> = $props();
	const typography = 'text-muted-foreground text-sm';
</script>

<span class={cn(typography, className)} {...rest}>
	{@render children?.()}
</span>
