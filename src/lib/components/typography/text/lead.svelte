<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	import { cn } from "$lib/utils";

	const {
		children,
		class: className,

		...rest
	}: {} & HTMLAttributes<HTMLParagraphElement> = $props();

	const typography = "text-muted-foreground text-xl";
</script>

<p class={cn(typography, className)} {...rest}>
	{@render children?.()}
</p>
