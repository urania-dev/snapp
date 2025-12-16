<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	import Icon from '@lucide/svelte/icons/arrow-down';
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	const isMobile = new IsMobile();

	let {
		children,
		class: classes,
		helper,
		items,
		open = $bindable(),
		title,
		variant = 'outline'
	}: {
		children: Snippet;
		class?: string;
		helper?: string;
		items: {
			href?: string;
			Icon?: typeof Icon;
			id: string;
			label: string;
			onclick?: MouseEventHandler<HTMLElement>;
			target?: string;
		}[];
		open: boolean;
		title: string;
		variant?: 'default' | 'ghost' | 'link' | 'outline';
	} = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->

{#if isMobile.current}
	<Drawer.Root bind:open>
		<Drawer.Trigger class={[classes]}>
			{#snippet child({ props })}
				<Button {variant} {...props}>
					{@render children?.()}
				</Button>
			{/snippet}
		</Drawer.Trigger>
		<Drawer.Content>
			<Drawer.Header>
				<Drawer.Title>{title}</Drawer.Title>
				<Drawer.Description>{helper}</Drawer.Description>
			</Drawer.Header>
			<div class="px-2 pb-4 flex flex-col gap-4">
				{#each items as item (item)}
					<Button
						target={item.target}
						variant="outline"
						class="w-full justify-between px-2 pe-4! text-base h-10 flex"
						onclick={item.onclick}
						href={item.href}
						><span>{item.label}</span>{#if item?.Icon}<span><item.Icon class="size-4!" /></span
							>{/if}</Button
					>
				{/each}
			</div>
		</Drawer.Content>
	</Drawer.Root>
{:else}
	<DropdownMenu.Root bind:open>
		<div class="relative">
			<DropdownMenu.Trigger class={[classes]}>
				{#snippet child({ props })}
					<Button {variant} {...props}>
						{@render children?.()}
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
		</div>
		<DropdownMenu.Content align="end">
			<DropdownMenu.Group>
				<DropdownMenu.Label>{title}</DropdownMenu.Label>
				<DropdownMenu.Separator />
				{#each items as item (item.id)}
					{#if item.href}
						<DropdownMenu.Item>
							{#snippet child({ props })}
								<a {...props} onclick={item.onclick} target={item.target} href={item.href}
									>{#if item?.Icon}<span><item.Icon class="size-4!" /></span>{/if}<span
										>{item.label}</span
									></a
								>
							{/snippet}
						</DropdownMenu.Item>
					{:else}
						<DropdownMenu.Item onclick={item.onclick}>{item.label}</DropdownMenu.Item>
					{/if}
				{/each}
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/if}
