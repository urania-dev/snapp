<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	import { cn } from "$lib/utils";

	const { children, class: className, ...rest }: {} & HTMLAttributes<HTMLHeadingElement> = $props();
	const typography =
		"scroll-m-20 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0";
</script>

<h2 class={cn(typography, className)} {...rest}>
	{@render children?.()}
</h2>
