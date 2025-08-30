<script lang="ts">
	import type { WithoutChild } from "bits-ui";

	import { cn } from "$lib/utils";
	import * as FormPrimitive from "formsnap";

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChild<FormPrimitive.LegendProps> = $props();
</script>

<FormPrimitive.Legend
	bind:ref
	class={cn("text-sm font-medium leading-none data-[fs-error]:text-destructive", className)}
	{...restProps}
/>
