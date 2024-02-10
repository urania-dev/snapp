<script lang="ts">
	import {
		AppBar,
		AppRail,
		AppRailAnchor,
		AppShell,
		initializeStores,
		Drawer,
		getDrawerStore,
		Modal
	} from '@skeletonlabs/skeleton';

	import '../../app.postcss';
	import { getLocale, setLocale } from '$lib/i18n';
	import { H4, Small } from '$lib/ui/typography';
	import Logo from '$lib/logo/logo.svg?raw';
	import HomeIcon from 'lucide-svelte/icons/home';
	import UserIcon from 'lucide-svelte/icons/user';
	import MenuIcon from 'lucide-svelte/icons/menu';
	import SunIcon from 'lucide-svelte/icons/sun';
	import DashboardIcon from 'lucide-svelte/icons/gauge';
	import UsersIcon from 'lucide-svelte/icons/users';
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import MetricsIcon from 'lucide-svelte/icons/database-zap';
	import MoonIcon from 'lucide-svelte/icons/moon';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { invalidateAll } from '$app/navigation';
	import { Toaster } from 'svelte-sonner';

	import hljs from 'highlight.js/lib/core';
	import 'highlight.js/styles/github-dark.css';
	import { storeHighlightJs } from '@skeletonlabs/skeleton';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import shell from 'highlight.js/lib/languages/shell';

	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('shell', shell);
	storeHighlightJs.set(hljs);

	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	import { navigating } from '$app/stores';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	export let data;

	let { theme, localization } = data;
	$: ({ theme, localization, fetch } = data);
	setLocale(localization);

	let { t, locale } = getLocale();

	$: locale.set(localization);

	initializeStores();

	const drawerStore = getDrawerStore();

	function handle_open_drawer() {
		drawerStore.open({ id: 'main:navigation' });
	}

	async function handle_theme() {
		document.forms.namedItem('change-mode')?.requestSubmit();
	}

	const handle_change_theme = async function ({ formData }) {
		let _theme = theme === 'dark' ? 'light' : 'dark';

		formData.set('theme', _theme);
		return async function ({ result }) {
			if (result.status === 200) await applyAction(result);
			await invalidateAll();

			let html = document.querySelector('html');

			switch (_theme) {
				case 'dark':
					html?.classList.remove('light');
					html?.classList.add('dark');
					break;
				case 'light':
					html?.classList.remove('dark');
					html?.classList.add('light');
					break;

				default:
					html?.classList.remove('light');
					html?.classList.add('dark');
					break;
			}

			theme = _theme as 'dark' | 'light';
		};
	} satisfies SubmitFunction;

	$: if($navigating !== null && $drawerStore.open === true) {
		drawerStore.close()
	}
</script>

<svelte:head><title>{$t('global:appname')}</title></svelte:head>

<Toaster />
<Modal width="w-modal-slim" />

<form action="/?/theme" method="post" id="change-mode" use:enhance={handle_change_theme} />
<Drawer width="w-8/12">
	{#if $drawerStore.id === 'main:navigation'}
		<div class="p-4 w-full gap-4 h-full flex flex-col">
			<a href="/">
				<H4 class="capitalize flex items-center">
					<div class="logo w-10 h-10 grid items-center justify-center">
						{@html Logo}
					</div>
					<span class="pb-1">
						{$t('global:appname')}
					</span>
				</H4>
			</a>
			<a href="/">
				<div class="flex gap-2 w-max items-center ps-1">
					<HomeIcon class="h-6 w-6 mx-auto" />
					<H4>{$t('global:pages:home')}</H4>
				</div>
			</a>
			{#if data.session !== null}
				<a href="/dashboard">
					<div class="flex gap-2 w-max items-center ps-1">
						<DashboardIcon class="h-6 w-6 mx-auto" />
						<H4>{$t('global:pages:dashboard')}</H4>
					</div>
				</a>
				{#if data.isAdmin}
					<a href="/dashboard/users/">
						<div class="flex gap-2 w-max items-center ps-1">
							<UsersIcon class="h-6 w-6 mx-auto" />
							<H4>{$t('global:pages:users')}</H4>
						</div>
					</a>
				{/if}
				<a href="/dashboard/metrics/">
					<div class="flex gap-2 w-max items-center ps-1">
						<MetricsIcon class="h-6 w-6 mx-auto" />
						<H4>{$t('global:pages:metrics')}</H4>
					</div>
				</a>
			{/if}
			<a href="/dashboard/settings/" class="mt-auto">
				<div class="flex gap-2 w-max items-center ps-1">
					<SettingsIcon class="h-6 w-6 mx-auto" />
					<H4>{$t('global:pages:settings')}</H4>
				</div>
			</a>
			<button class="max-w-max w-full h-10 flex items-center ps-1 gap-2" on:click={handle_theme}>
				{#if theme === 'light'}
					<SunIcon class="h-6 w-6 mx-auto" />
				{:else}
					<MoonIcon class="h-6 w-6 mx-auto" />
				{/if}
				<H4>
					{#if theme === 'dark'}
						{$t('settings:theme:dark')}
					{:else}
						{$t('settings:theme:light')}
					{/if}
				</H4>
			</button>
		</div>
	{/if}
</Drawer>
<AppShell>
	<svelte:fragment slot="header">
		<AppBar
			gridColumns="grid-cols-3"
			slotDefault="place-self-center"
			slotTrail="place-content-end"
			class="md:hidden shadow-md"
		>
			<svelte:fragment slot="lead">
				<button class="btn variant-outline-primary aspect-square p-1" on:click={handle_open_drawer}>
					<MenuIcon class="h-6 w-6" />
				</button>
			</svelte:fragment>
			<a href="/" class="justify-start">
				<H4 class="capitalize">
					{$t('global:appname')}
				</H4>
			</a>
		</AppBar>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<AppRail class="hidden md:grid border-r border-primary-300-600-token">
			<svelte:fragment slot="lead">
				<AppRailAnchor href="/">
					<div class="flex flex-col gap-2">
						<HomeIcon class="h-6 w-6 mx-auto" />
						<Small class="text-xs font-bold">{$t('global:pages:home')}</Small>
					</div>
				</AppRailAnchor>
				{#if data.session !== null}
					<AppRailAnchor href="/dashboard/">
						<div class="flex flex-col gap-2">
							<DashboardIcon class="h-6 w-6 mx-auto" />
							<Small class="text-xs font-bold">{$t('global:pages:dashboard')}</Small>
						</div>
					</AppRailAnchor>
					{#if data.isAdmin}
						<AppRailAnchor href="/dashboard/users/">
							<div class="flex flex-col gap-2">
								<UsersIcon class="h-6 w-6 mx-auto" />
								<Small class="text-xs font-bold">{$t('global:pages:users')}</Small>
							</div>
						</AppRailAnchor>
					{/if}
					<AppRailAnchor href="/dashboard/metrics/">
						<div class="flex flex-col gap-2">
							<MetricsIcon class="h-6 w-6 mx-auto" />
							<Small class="text-xs font-bold">{$t('global:pages:metrics')}</Small>
						</div>
					</AppRailAnchor>
					{:else}
					<AppRailAnchor href="/auth/sign-in">
						<div class="flex flex-col gap-2">
							<UserIcon class="h-6 w-6 mx-auto" />
							<Small class="text-xs font-bold">{$t('auth:sign:in')}</Small>
						</div>
					</AppRailAnchor>
				{/if}
			</svelte:fragment>

			<svelte:fragment slot="trail">
				{#if data.session !== null}
					<AppRailAnchor href="/dashboard/settings/">
						<div class="flex flex-col gap-2">
							<SettingsIcon class="h-6 w-6 mx-auto" />
							<Small class="text-xs font-bold">{$t('global:pages:settings')}</Small>
						</div>
					</AppRailAnchor>
				{/if}
				<AppRailAnchor href="#" on:click={handle_theme}>
					<div class="flex flex-col gap-2">
						{#if theme === 'light'}
							<SunIcon class="h-6 w-6 mx-auto" />
							<Small class="text-xs font-bold">{$t('settings:theme:light')}</Small>
						{:else}
							<MoonIcon class="h-6 w-6 mx-auto" />
							<Small class="text-xs font-bold">{$t('settings:theme:dark')}</Small>
						{/if}
					</div>
				</AppRailAnchor>
			</svelte:fragment>
		</AppRail>
	</svelte:fragment>
	<slot />
</AppShell>

<style>
</style>
