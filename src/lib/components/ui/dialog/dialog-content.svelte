<script lang="ts">
	import type { Snippet } from "svelte";

	import { cn } from "$lib/utils";
	import { Dialog as DialogPrimitive, type WithoutChildrenOrChild } from "bits-ui";

	import * as Dialog from "./index.js";

	let {
		children,
		class: className,
		portalProps,
		ref = $bindable(null),
		...restProps
	}: {
		children: Snippet;
		portalProps?: DialogPrimitive.PortalProps;
	} & WithoutChildrenOrChild<DialogPrimitive.ContentProps> = $props();
</script>

<Dialog.Portal {...portalProps}>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		bind:ref
		class={cn(
			"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
			className
		)}
		{...restProps}
	>
		{@render children?.()}
		<DialogPrimitive.Close
			class="absolute right-4 top-4 h-5 w-5 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
		>
			<i class="ph ph-x text-[20px]"></i>
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</Dialog.Portal>
