<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	const { children, class: className, ...rest }: {} & HTMLAttributes<HTMLDivElement> = $props();

	const typography = 'text-lg font-semibold';
</script>

<div class={cn(typography, className)} {...rest}>
	{@render children?.()}
</div>
