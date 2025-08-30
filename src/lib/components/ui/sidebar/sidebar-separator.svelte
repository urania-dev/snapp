<script lang="ts">
	import type { ComponentProps } from "svelte";

	import { Separator } from "$lib/components/ui/separator/index.js";
	import { cn } from "$lib/utils";

	let {
		class: className,
		ref = $bindable(null),

		...restProps
	}: ComponentProps<typeof Separator> = $props();
</script>

<Separator
	bind:ref
	data-sidebar="separator"
	class={cn("mx-2 w-auto bg-sidebar-border", className)}
	{...restProps}
/>
