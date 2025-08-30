<script lang="ts">
	import { cn } from "$lib/utils";
	import { Command as CommandPrimitive } from "bits-ui";

	let {
		class: className,
		ref = $bindable(null),
		value = $bindable(""),
		...restProps
	}: CommandPrimitive.InputProps = $props();
</script>

<div class="flex items-center border-b px-2" data-command-input-wrapper="">
	<i class="ph ph-magnifying-glass mr-2 shrink-0 text-[20px] opacity-50"></i>
	<CommandPrimitive.Input
		class={cn(
			"flex h-11 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
			className
		)}
		bind:ref
		{...restProps}
		bind:value
	/>
</div>
