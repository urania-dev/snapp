<script lang="ts">
	import '../app.css';

	const { children, data } = $props();
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import AppSidebar from '$lib/components/sidebar/appsidebar.svelte';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { setTranslations } from '$lib/i18n/index.svelte';
	import { mode, setMode } from 'mode-watcher';
	import SvelteSeo from "svelte-seo";
	import { Toaster } from 'svelte-sonner';
	import { fade } from 'svelte/transition';
	const i18n = setTranslations(data.translations, data.locale);
	setMode(data.theme as 'dark' | 'light');
	$effect(() => {
		if (
			browser &&
			window.matchMedia('(prefers-color-scheme: dark)').matches &&
			data.theme === 'system'
		)
			setMode('dark');
	});

	$effect(() => {
		if (data.translations) {
			i18n.set(data.translations);
			i18n.locale = data.locale;
		}
	});

	const paths = ['/admin', '/dashboard', '/docs', '/groups', '/metrics', '/settings', '/users'];
	const SHOW_MENU = $derived(
		paths.includes(page?.url?.pathname) || paths?.some((p) => page?.url?.pathname?.startsWith(p))
	);

	
</script>

<div class="flex h-[100dvh] w-screen" in:fade|global>
	<Sidebar.Provider class="flex w-full">
		<AppSidebar
			show={SHOW_MENU}
			{i18n}
			disableHome={data.disableHome}
			role={data.role}
			url={new URL(data.url)}
		/>
		<main class="flex h-full w-full flex-col overflow-hidden">
			{#if SHOW_MENU}
				<div class="flex h-14 w-full shrink-0 items-center gap-2 border-b px-2">
					<Sidebar.Trigger class="h-10 w-10"></Sidebar.Trigger>
					<Separator orientation="vertical" />
					
				</div>
			{/if}
			{#key page.url.pathname}
				<div class="flex h-full w-full flex-col" in:fade|global>
					{@render children?.()}
				</div>
			{/key}
		</main>
	</Sidebar.Provider>
</div>
<Toaster position="top-right" theme={$mode} />

<SvelteSeo
	title={data.appname||'Snapp'}
	description={i18n.t('homepage.getting-started.claim')}
	canonical={env.PUBLIC_URL}
  	keywords="self-hosted URL shortening, Snapp, URL management, link shortening, 
	custom short URLs, secure authentication, protected URLs, analytics, Umami integration,
	VirusTotal API, REST API, open source, Docker deployment, migration, CSV export, secret links, 
	personalized short codes, link engagement, privacy-focused, community-requested features, swagger documentation."
    openGraph={{
		description:
		  "Learn about primal movement exercises and how they can benefit your fitness.",
		images:[{alt:"Screenshot",height:800, url:'/screenshot.png', width:1600}],
		title: data.appname||'Snapp',
		type:"website",
		url: env.PUBLIC_URL}}

/>