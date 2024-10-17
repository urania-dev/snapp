<script lang="ts">
	import { _ } from 'svelte-i18n';
	import '../app.css';
	import Sidenav from '$lib/ui/sidenav.svelte';
	import { Toaster } from '$lib/svelte-sonner';
	import { fade } from 'svelte/transition';

	let { data, children } = $props();

	let menu_items: MenuItem[] = $derived([
		{
			label: $_('menu.home'),
			url: '/',
			active: data.pathname === '/',
			icon: 'house',
			visible: data.home_disabled !== true
		},
		{
			label: $_('menu.dashboard'),
			url: '/dashboard',
			active: data.pathname.startsWith('/dashboard'),
			icon: 'squares-four',
			visible: data.is_authenticated
		},
		{
			label: $_('menu.users'),
			url: '/users',
			active: data.pathname.startsWith('/users'),
			icon: 'users',
			visible: data.is_authenticated && data.is_admin
		},
		{
			label: $_('menu.metrics'),
			url: '/metrics',
			active: data.pathname.startsWith('/metrics'),
			icon: 'presentation-chart',
			visible: data.is_authenticated
		},
		{
			label: $_('menu.tags'),
			url: '/tags',
			active: data.pathname.startsWith('/tags'),
			icon: 'tag-simple',
			visible: data.is_authenticated
		},
		{
			label: $_('menu.settings'),
			url: '/settings',
			active: data.pathname.startsWith('/settings'),
			icon: 'gear',
			css: 'md:m-0 md:mt-auto',
			visible: data.is_authenticated
		},
	
		{
			label: $_('menu.authenticate'),
			url: '/auth/sign-in',
			active: data.pathname.startsWith('/auth'),
			icon: 'user',
			css: 'md:m-0 ms-auto md:mt-auto',
			visible: !data.is_authenticated
		}
	]);

	const sidebardPages = ['/', '/metrics', '/docs', '/auth', '/tags'];
</script>

<Toaster theme={(data.theme || 'dark') as 'dark' | 'light'} />

<div class="flex w-screen" style:height="100dvh">
	{#if sidebardPages.includes(data.pathname) || data.pathname.startsWith('/dashboard') ||data.pathname.startsWith('/tags') || data.pathname.startsWith('/users') || data.pathname.startsWith('/settings')}
		<Sidenav {menu_items}></Sidenav>
	{/if}
	{#key data.pathname}
		<div class="flex h-full w-full flex-col overflow-hidden overflow-y-scroll" in:fade>
			{@render children?.()}
			<div class="flex h-20 w-full shrink-0 md:hidden md:h-0">&nbsp;</div>
		</div>
	{/key}
</div>

<svelte:head>
	<title>{$_('appname')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
