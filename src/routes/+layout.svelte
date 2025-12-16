<script lang="ts">
	import { page } from '$app/state';

	import './layout.css';
	import favicon from '$lib/assets/logo.svg';
	import NotificationPanel from '$lib/components/blocks/notification/notification-panel.svelte';
	import AppSidebar from '$lib/components/blocks/sidebar/app-sidebar.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import * as Sidebar from '$lib/components/ui/sidebar/index';
	import { Toaster } from '$lib/components/ui/sonner';
	import { m } from '$lib/paraglide/messages.js';
	import { ModeWatcher } from 'mode-watcher';

	const { children, data } = $props();

	const showSidebar = $derived(
		page.url?.pathname !== '/' &&
			data?.user !== undefined &&
			(!page.data?.snappHasSecret || page.data?.snappHasSecret !== true)
	);

	const path = $derived.by(() => {
		let path = '';
		switch (true) {
			case page.url.pathname === '/dashboard':
				path = m.dashboard();
				break;
			case page.url.pathname.startsWith('/urls'):
				path = m.url_list();
				break;
			case page.url.pathname.startsWith('/organizations'):
				path = m.organizations();
				break;
			case page.url.pathname.startsWith('/users'):
				path = m.users();
				break;
			case page.url.pathname.startsWith('/teams'):
				path = m.teams();
				break;
			case page.url.pathname === '/metrics':
				path = m.metrics();
				break;
			default:
				break;
		}

		return path;
	});
</script>

<Sidebar.Provider>
	{#if showSidebar === true}
		<AppSidebar
			user={data.user}
			appname={data.appname}
			host={data.host}
			logo={data.activeOrganization?.logo || ''}
		/>
	{/if}
	<main class="flex h-svh w-full flex-col">
		{#if showSidebar}
			<nav class="flex h-14 w-full shrink-0 items-center border-b border-input px-0">
				<Sidebar.Trigger class="h-14 w-14 rounded-none" />
				<Separator class="-ms-px w-px! overflow-clip border-input" orientation="vertical" />
				<div class={['ms-auto flex h-14', page.url.pathname.startsWith('/settings') && 'me-14']}>
					<Separator class="-ms-px w-px! overflow-clip border-input" orientation="vertical" />
					<NotificationPanel data={data.notifications} />
				</div>
			</nav>
		{/if}
		<div class="flex w-full grow flex-col overflow-y-scroll">
			{@render children()}
		</div>
	</main>
</Sidebar.Provider>
<ModeWatcher defaultMode="dark" />
<Toaster />

<svelte:head>
	<link rel="icon" href={data.activeOrganization?.logo || favicon} />
	<title>{data.appname}{(path.trim() !== '' && ` | ${path}`) || ''}</title>
</svelte:head>
