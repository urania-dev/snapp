<script lang="ts">
	import { cn } from "$lib/utils";
	import { Select as SelectPrimitive, type WithoutChildrenOrChild } from "bits-ui";

	let {
		class: className,
		ref = $bindable(null),
		...restProps
	}: WithoutChildrenOrChild<SelectPrimitive.ScrollUpButtonProps> = $props();
</script>

<SelectPrimitive.ScrollUpButton
	bind:ref
	class={cn("flex cursor-default items-center justify-center py-1", className)}
	{...restProps}
>
	<i class="ph ph-caret-up text-[20px]"></i>
</SelectPrimitive.ScrollUpButton>
