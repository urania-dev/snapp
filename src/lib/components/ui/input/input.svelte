<script lang="ts">
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLInputAttributes } from 'svelte/elements';

	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';

	let {
		class: className,
		container,
		icon,
		ref = $bindable(null),
		value = $bindable(), // eslint-disable-next-line svelte/valid-compile
		...restProps
	}: { container?: string; icon?: string } & WithElementRef<HTMLInputAttributes> = $props();

	let openTooltip = $state(false);
</script>

<div
	class={cn(
		'group m-[1px] flex h-10 w-full items-center gap-2 overflow-clip rounded border border-input px-2 py-0.5 focus-within:outline-none focus-within:ring-2',
		container
	)}
>
	{#if icon}
		{#if restProps.title}
			<Tooltip.Provider>
				<Tooltip.Root bind:open={openTooltip}>
					<Tooltip.Trigger
						class="h-5"
						onmouseleave={() => {
							setTimeout(() => {
								if (openTooltip) openTooltip = false;
							}, 500);
						}}
					>
						<i class="ph-duotone text-[20px] ph-{icon}"></i>
					</Tooltip.Trigger>

					<Tooltip.Content>
						<p>
							{restProps.title}
						</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</Tooltip.Provider>
		{:else}
			<i class="ph-duotone text-[20px] ph-{icon}"></i>
		{/if}
	{/if}
	<input
		bind:this={ref}
		class={cn(
			'flex h-10 w-full bg-transparent p-0 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
			className
		)}
		bind:value
		{...restProps}
	/>
</div>

<style>
	input:-webkit-autofill,
	input:-webkit-autofill:hover,
	input:-webkit-autofill:focus,
	input:-webkit-autofill:active {
		-webkit-box-shadow: 0 0 0 28px hsl(var(--background)) inset !important;
		-webkit-text-fill-color: hsl(var(--foreground)) !important;
	}
</style>
