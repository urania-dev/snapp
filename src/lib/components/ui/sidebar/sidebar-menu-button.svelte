<script lang="ts" module>
	import { tv, type VariantProps } from 'tailwind-variants';

	export const sidebarMenuButtonVariants = tv({
		base: 'peer/menu-button ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none transition-[width,height,padding] focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:font-medium  [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0',
		defaultVariants: {
			size: 'default',
			variant: 'default'
		},
		variants: {
			size: {
				default: 'h-8 text-sm',
				lg: 'h-12 text-sm group-data-[collapsible=icon]:!p-0',
				sm: 'h-7 text-xs'
			},
			variant: {
				default: 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
				outline:
					'bg-background hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]'
			}
		}
	});

	export type SidebarMenuButtonVariant = VariantProps<typeof sidebarMenuButtonVariants>['variant'];
	export type SidebarMenuButtonSize = VariantProps<typeof sidebarMenuButtonVariants>['size'];
</script>

<script lang="ts">
	import type { ComponentProps, Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils';
	import { mergeProps, type WithElementRef, type WithoutChildrenOrChild } from 'bits-ui';

	import { useSidebar } from './context.svelte.js';

	let {
		child,
		children,
		class: className,
		isActive = false,
		ref = $bindable(null),
		size = 'default',
		tooltipContent,
		tooltipContentProps,
		variant = 'default',
		...restProps
	}: {
		child?: Snippet<[{ props: Record<string, unknown> }]>;
		isActive?: boolean;
		size?: SidebarMenuButtonSize;
		tooltipContent?: Snippet;
		tooltipContentProps?: WithoutChildrenOrChild<ComponentProps<typeof Tooltip.Content>>;
		variant?: SidebarMenuButtonVariant;
	} & WithElementRef<HTMLAttributes<HTMLButtonElement>, HTMLButtonElement> = $props();

	const sidebar = useSidebar();

	const buttonProps = $derived({
		class: cn(sidebarMenuButtonVariants({ size, variant }), className),
		'data-active': isActive,
		'data-sidebar': 'menu-button',
		'data-size': size,
		...restProps
	});

	let openTooltip = $state(false);
</script>

{#snippet Button({ props }: { props?: Record<string, unknown> })}
	{@const mergedProps = mergeProps(buttonProps, props)}
	{#if child}
		{@render child({ props: mergedProps })}
	{:else}
		<button bind:this={ref} {...mergedProps}>
			{@render children?.()}
		</button>
	{/if}
{/snippet}

{#if !tooltipContent}
	{@render Button({})}
{:else}
	<Tooltip.Root delayDuration={300} bind:open={openTooltip}>
		<Tooltip.Trigger
			onmouseleave={() => {
				setTimeout(() => {
					if (openTooltip) openTooltip = false;
				}, 1000);
			}}
		>
			{#snippet child({ props })}
				{@render Button({ props })}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content
			side="right"
			align="center"
			hidden={sidebar.state !== 'collapsed' || sidebar.isMobile}
			children={tooltipContent}
			{...tooltipContentProps}
		/>
	</Tooltip.Root>
{/if}
