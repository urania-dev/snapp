<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import BracesIcon from '@lucide/svelte/icons/braces';
	import CogIcon from '@lucide/svelte/icons/cog';
	import UserRoundCogIcon from '@lucide/svelte/icons/user-round-cog';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { m } from '$lib/paraglide/messages';
	let {
		collapsible = 'icon',
		ref = $bindable(null),
		user,
		...restProps
	}: {
		user?: User;
	} & ComponentProps<typeof Sidebar.Root> = $props();
	const sidebar = Sidebar.useSidebar();
	$effect(() => {
		if (navigating.from !== null && sidebar.openMobile) {
			sidebar.openMobile = false;
		}
	});
	const items = $derived([
		{
			hidden: false,
			icon: UserRoundCogIcon,
			isActive: page.url.pathname === '/settings/profile',
			title: m.profile(),
			url: '/settings/profile' as const
		},
		{
			hidden: user?.role !== 'admin',
			icon: CogIcon,
			isActive: page.url.pathname === '/settings',
			title: m.settings(),
			url: '/settings' as const
		},
		{
			hidden: false,
			icon: BracesIcon,
			isActive: page.url.pathname === '/settings',
			title: m.rest_api_tokens(),
			url: '/settings/rest-api-tokens' as const
		}
	]);
</script>

<Sidebar.Root
	{collapsible}
	{...restProps}
	side="right"
	class="top-0 bottom-0"
	--sidebar-width-icon="56px"
>
	<Sidebar.Content class="flex h-full w-full flex-col gap-0">
		<Sidebar.Trigger
			class="h-14 w-full min-w-14 -scale-x-100 justify-start rounded-none border-b px-4.5 group-data-[collapsible=icon]:justify-center"
		/>
		{#each items as item (item.url)}
			{#if !item.hidden}
				<Sidebar.MenuButton isActive={page.url.pathname === item.url} tooltipContent={item.title}>
					{#snippet child({ props })}
						<a
							{...props}
							class={[
								props.class,
								'square flex h-14! rounded-none border-b px-4.5 group-data-[collapsible=icon]:size-14! group-data-[collapsible=icon]:px-4.5!'
							]}
							href={resolve(item.url)}
						>
							{#if item.icon}
								<item.icon class="size-5!" />
							{/if}
							<span class="group-data-[collapsible=icon]:hidden">{item.title}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			{/if}
		{/each}
	</Sidebar.Content>
</Sidebar.Root>
