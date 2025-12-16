<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';
	import type { ComponentProps } from 'svelte';

	import BuildingIcon from '@lucide/svelte/icons/building-2';
	import MetricsIcon from '@lucide/svelte/icons/chart-no-axes-combined';
	import GroupIcon from '@lucide/svelte/icons/group';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import Link2Icon from '@lucide/svelte/icons/link-2';
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import { navigating, page } from '$app/state';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { m } from '$lib/paraglide/messages';

	import AppSidebarFooter from './app-sidebar-footer.svelte';
	import AppSidebarHeader from './app-sidebar-header.svelte';
	import SidebarGroup from './sidebar-group.svelte';
	let {
		appname,
		collapsible = 'icon',
		host,
		logo,
		ref = $bindable(null),
		user,
		...restProps
	}: { appname: string; host: THost; logo?: string; user?: null | User } & ComponentProps<
		typeof Sidebar.Root
	> = $props();
	const sidebar = Sidebar.useSidebar();
	$effect(() => {
		if (navigating.from !== null && sidebar.openMobile) {
			sidebar.openMobile = false;
		}
	});
	const items = $derived([
		{
			icon: LayoutDashboardIcon,
			isActive: page.url.pathname === '/dashboard',
			title: m.dashboard(),
			url: '/dashboard' as const
		},
		{
			icon: Link2Icon,
			isActive: page.url.pathname.startsWith('/urls'),
			title: m.url_list(),
			url: '/urls' as const
		},
		{
			hidden: !user || user?.role !== 'admin',
			icon: BuildingIcon,
			isActive: page.url.pathname.startsWith('/organizations'),
			title: m.organizations(),
			url: '/organizations' as const
		},
		{
			hidden: !user || user?.role !== 'admin',
			icon: UsersRoundIcon,
			isActive: page.url.pathname.startsWith('/users'),
			title: m.users(),
			url: '/users' as const
		},
		{
			icon: GroupIcon,
			isActive: page.url.pathname.startsWith('/teams'),
			title: m.teams(),
			url: '/teams' as const
		},
		{
			icon: MetricsIcon,
			isActive: page.url.pathname === '/metrics',
			title: m.metrics(),
			url: '/metrics' as const
		}
	]);
</script>

<Sidebar.Root {collapsible} {...restProps}>
	<AppSidebarHeader {host} {appname} {logo} />
	<Sidebar.Content>
		<SidebarGroup {items} />
	</Sidebar.Content>
	<AppSidebarFooter {user} />
</Sidebar.Root>
