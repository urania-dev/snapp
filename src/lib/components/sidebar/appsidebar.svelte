<script lang="ts">
	import { page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { type TranslationsStoreType } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';

	let {
		disableHome,
		i18n,
		role,
		show: SHOW_MENU,
		url
	}: {
		disableHome: boolean;
		i18n: TranslationsStoreType;
		role: string;
		show: boolean;
		url: URL;
	} = $props();

	const menuItems = $derived([
		{
			href: '/',
			icon: 'ph-house',
			isActive: url.pathname === '/',
			label: i18n.t('menu.home'),
			visible: disableHome !== true
		},
		{
			href: '/dashboard',
			icon: 'ph-squares-four',
			isActive: url.pathname.startsWith('/dashboard'),

			label: i18n.t('menu.dashboard'),
			subMenu: [
				{
					href: '/dashboard',
					icon: 'ph-list',
					isActive: url.pathname === '/dashboard',
					label: i18n.t('snapps.label'),
					visible: true
				},
				{
					href: '/dashboard/shorten',
					icon: 'ph-plus',
					isActive: url.pathname === '/dashboard/shorten',
					label: i18n.t('snapps.labels.create'),
					visible: true
				},
				{
					href: '/dashboard/tags',
					icon: 'ph-tag-simple',
					isActive: url.pathname.startsWith('/dashboard/tags'),
					label: i18n.t('menu.tags'),
					visible: true
				}
			]
		},
		{
			href: '/users',
			icon: 'ph-users',
			isActive: url.pathname.startsWith('/users'),
			label: i18n.t('menu.users'),
			visible: role !== 'user'
		},
		{
			href: '/groups',
			icon: 'ph-chats',
			isActive: url.pathname.startsWith('/groups'),
			label: i18n.t('menu.groups'),
			visible: true
		},
		{
			href: '/metrics',
			icon: 'ph-presentation-chart',
			isActive: url.pathname.startsWith('/metrics'),
			label: i18n.t('menu.metrics'),
			visible: true
		}
	]);
</script>

{#if SHOW_MENU}
	<div class="relative">
		<Sidebar.Root id="settings" collapsible="icon" side="left" --sidebar-width-icon="48px">
			<Sidebar.Content>
				<Sidebar.Group class="!gap-2 p-0">
					{#each menuItems as item}
						{#if item?.visible !== false}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									isActive={item.isActive}
									size="lg"
									class="rounded-none border-0 px-2.5 data-[active='true']:border-r data-[active='true']:border-r-[rebeccapurple] data-[active='true']:bg-[rebeccapurple]/35 group-data-[collapsible='icon']:!size-12 group-data-[collapsible='icon']:!px-2.5"
								>
									{#snippet tooltipContent()}
										<span>{item.label}</span>
									{/snippet}
									{#snippet child({ props })}
										<a {...props} href={item.href}>
											<i
												class={`ph${item.icon !== 'ph-plus' ? '-duotone' : ''} ${item.icon} text-center text-[28px] transition-all`}
												class:text-[rebeccapurple]={item.isActive}
											></i>
											<span class="me-auto font-semibold group-data-[collapsible='icon']:hidden"
												>{item.label}</span
											>
										</a>
									{/snippet}
								</Sidebar.MenuButton>

								{#if item.subMenu && item.isActive}
									<Sidebar.MenuSub class="mb-4 gap-1 p-0 ps-2 pt-2">
										{#each item.subMenu as subItem, i}
											{#if subItem?.visible}
												<Sidebar.MenuSubItem class="w-full">
													<Sidebar.MenuSubButton isActive={subItem.isActive}>
														{#snippet child({ props: { class: classes, ...props } })}
															<a
																in:fly|global={{
																	delay: prefersReducedMotion.current ? 0 : i * 100,
																	duration: prefersReducedMotion.current ? 0 : 500,
																	y: prefersReducedMotion.current ? 0 : 12
																}}
																{...props}
																href={subItem.href}
																class={cn(
																	classes as string,
																	'!flex h-10 w-full !items-center gap-2'
																)}
															>
																<i
																	class={`ph${subItem.icon !== 'ph-plus' ? '-duotone' : ''} ${subItem.icon} p-0 pb-0.5 text-center text-[24px] transition-all`}
																></i>
																<span class="me-auto p-0 font-semibold"
																	>{i18n.t(subItem.label)}</span
																>
															</a>
														{/snippet}
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											{/if}
										{/each}
									</Sidebar.MenuSub>
								{/if}
							</Sidebar.MenuItem>
						{/if}
					{/each}
				</Sidebar.Group>
			</Sidebar.Content>
			<Sidebar.Footer class="p-0">
				<Sidebar.MenuButton
					isActive={page.url.pathname.startsWith('/settings')}
					size="lg"
					class="rounded-none !px-2.5 data-[active='true']:border-r data-[active='true']:border-r-[rebeccapurple] data-[active='true']:bg-[rebeccapurple]/35 group-data-[collapsible='icon']:!size-12 group-data-[collapsible='icon']:!px-2.5"
				>
					{#snippet tooltipContent()}
						<span>{i18n.t('menu.settings')}</span>
					{/snippet}
					{#snippet child({ props })}
						<a {...props} href="/settings">
							<i class="ph-duotone ph-gear text-center text-[28px] transition-all"></i>
							<span class="me-auto font-semibold group-data-[collapsible='icon']:hidden"
								>{i18n.t('menu.settings')}</span
							>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.Footer>
		</Sidebar.Root>
	</div>
{/if}
