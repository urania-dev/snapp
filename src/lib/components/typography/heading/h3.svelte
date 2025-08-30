<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	import { cn } from "$lib/utils";

	const { children, class: className, ...rest }: {} & HTMLAttributes<HTMLHeadingElement> = $props();

	const typography = "scroll-m-20 text-2xl font-semibold tracking-tight";
</script>

<h3 class={cn(typography, className)} {...rest}>
	{@render children?.()}
</h3>
