<script lang="ts">
	import { cn } from "$lib/utils";
	import { Command as CommandPrimitive } from "bits-ui";

	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(""),
		...restProps
	}: CommandPrimitive.RootProps = $props();
</script>

<CommandPrimitive.Root
	class={cn(
		"flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
		className
	)}
	bind:value
	bind:ref
	{...restProps}
/>
