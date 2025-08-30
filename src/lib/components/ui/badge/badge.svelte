<script lang="ts" module>
	import { tv, type VariantProps } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "focus:ring-ring inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
		defaultVariants: {
			variant: "default"
		},
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/80 border-transparent",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/80 border-transparent",
				outline: "text-foreground",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent"
			}
		}
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import type { WithElementRef } from "bits-ui";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	import { cn } from "$lib/utils.js";

	let {
		children,
		class: className,
		href,
		ref = $bindable(null),
		variant = "default",
		...restProps
	}: {
		variant?: BadgeVariant;
	} & WithElementRef<HTMLAnchorAttributes> = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
