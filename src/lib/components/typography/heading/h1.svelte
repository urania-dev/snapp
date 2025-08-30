<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	import { cn } from "$lib/utils";

	const { children, class: className, ...rest }: {} & HTMLAttributes<HTMLHeadingElement> = $props();
	const typography = "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl";
</script>

<h1 class={cn(typography, className)} {...rest}>
	{@render children?.()}
</h1>
