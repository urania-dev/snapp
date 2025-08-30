<script lang="ts">
	import type { WithElementRef } from "bits-ui";
	import type { Snippet } from "svelte";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	import { cn } from "$lib/utils";

	let {
		child,
		children,
		class: className,
		isActive,
		ref = $bindable(null),
		size = "md",
		...restProps
	}: {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		isActive?: boolean;
		size?: "md" | "sm";
	} & WithElementRef<HTMLAnchorAttributes> = $props();

	const mergedProps = $derived({
		class: cn(
			"text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
			"data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
			size === "sm" && "text-xs",
			size === "md" && "text-sm",
			"group-data-[collapsible=icon]:hidden",
			className
		),
		"data-active": isActive,
		"data-sidebar": "menu-sub-button",
		"data-size": size,

		...restProps
	});
</script>

{#if child}
	{@render child({ props: mergedProps })}
{:else}
	<a bind:this={ref} {...mergedProps}>
		{@render children?.()}
	</a>
{/if}
