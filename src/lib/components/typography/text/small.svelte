<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";

	import { cn } from "$lib/utils";

	const { children, class: className, ...rest }: {} & HTMLAttributes<HTMLElement> = $props();
	const typography = "text-sm font-medium leading-none";
</script>

<small class={cn(typography, className)} {...rest}>
	{@render children?.()}
</small>
