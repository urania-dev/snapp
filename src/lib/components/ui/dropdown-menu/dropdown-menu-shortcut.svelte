<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	import { cn } from "$lib/utils";
	import { type WithElementRef } from "bits-ui";

	let {
		children,
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> = $props();
</script>

<span
	bind:this={ref}
	class={cn("ml-auto text-xs tracking-widest opacity-60", className)}
	{...restProps}
>
	{@render children?.()}
</span>
