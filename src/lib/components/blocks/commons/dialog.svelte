<script lang="ts">
	import type { Snippet } from 'svelte';

	import * as Dialog from '$lib/components/ui/dialog/index';
	import * as Drawer from '$lib/components/ui/drawer/index';
	import { MediaQuery } from 'svelte/reactivity';
	type DialogProps = {
		children?: Snippet;
		class?: string;
		description: string;
		onOpenChange?: (open: boolean) => void;
		open: boolean;
		title: string;
	};
	let {
		children,
		class: classes,
		description,
		onOpenChange,
		open = $bindable(),
		title
	}: DialogProps = $props();
	const isDesktop = new MediaQuery('(min-width: 768px)');
</script>

{#key open}
	{#if isDesktop.current}
		<Dialog.Root
			bind:open
			{onOpenChange}
			onOpenChangeComplete={(o) => {
				open = o;
			}}
		>
			<Dialog.Content class={['sm:max-w-[500px]', classes]}>
				<Dialog.Header>
					<Dialog.Title>{title}</Dialog.Title>
					<Dialog.Description class=" text-balance empty:hidden">
						{description}
					</Dialog.Description>
				</Dialog.Header>
				{@render children?.()}
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<Drawer.Root
			bind:open
			onOpenChangeComplete={(o) => {
				open = o;
			}}
		>
			<Drawer.Content class={['rounded-t-2xl!', classes]}>
				<Drawer.Header class="text-left">
					<Drawer.Title>{title}</Drawer.Title>
					<Drawer.Description>
						{description}
					</Drawer.Description>
				</Drawer.Header>
				<div class="p-4">
					{@render children?.()}
				</div>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
{/key}
