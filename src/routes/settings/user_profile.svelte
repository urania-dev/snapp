<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import Input from '$lib/ui/input.svelte';
	import Select from '$lib/ui/select.svelte';
	import { debounce } from '$lib/utils/debounce';
	import { translateLanguage } from '$lib/utils/language';
	import { _, locale, locales } from 'svelte-i18n';
	import type { MouseEventHandler } from 'svelte/elements';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import type { SubmitFunction } from './$types';
	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';

	let {
		is_admin,
		active_field = $bindable(),
		username = $bindable(),
		role = $bindable(),
		email = $bindable(),
		theme = $bindable(),
		lang = $bindable(),
		save_this
	}: {
		username: string;
		role: 'user' | 'admin' | 'root';
		email: string;
		is_admin: boolean;
		active_field: string | undefined;
		theme: string;
		lang: string;
		save_this(...args: any): void;
	} = $props();

	let search_language = $state<string>();
	const handle_change_theme: MouseEventHandler<HTMLButtonElement> = (e) => {
		const _theme = theme === 'light' ? 'dark' : 'light';
		save_this('theme', _theme, 'settings');
		document.documentElement.classList.remove('dark', 'light');
		document.documentElement.classList.add(`${_theme}`);
	};
	let language_placeholder = $derived(translateLanguage($locale || 'en', $locale || 'en'));
	let languages = $derived(
		$locales
			.map((l) => ({ id: l, value: translateLanguage(lang, l) }))
			.filter((l) =>
				search_language ? l.value.toLowerCase().startsWith(search_language.toLowerCase()) : l
			)
	);

	let resetMFA_is_open = $state(false);
	let modal_is_open = $state(false);
	const close_modal: MouseEventHandler<HTMLButtonElement> = (e) => {
		e?.stopPropagation();
		modal_is_open = false;
		resetMFA_is_open = false;
	};
	const open_modal: MouseEventHandler<HTMLButtonElement> = (e) => {
		e?.stopPropagation();
		modal_is_open = true;
	};

	const enhanceResetPassword: SubmitFunction = ({ formData, cancel }) => {
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.error($_(form?.message));
		};
	};

	const enhanceResetMFA: SubmitFunction = ({ formData, cancel }) => {
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.error($_(form?.message));
		};
	};
	let { form } = $derived($page);

	const handle_reset_password: MouseEventHandler<HTMLButtonElement> = (e) => {
		document.forms.namedItem('reset-password')?.requestSubmit();
		modal_is_open = false;
	};

	const open_reset_mfa: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.stopPropagation();
		e.preventDefault();
		resetMFA_is_open = true;
	};
	const handle_reset_mfa: MouseEventHandler<HTMLButtonElement> = (e) => {
		document.forms.namedItem('reset-mfa')?.requestSubmit();
	};
	let innerWidth = $state<number>(0);
</script>

<svelte:window bind:innerWidth />
{#if modal_is_open}
	<div
		class="fixed inset-0 z-20 grid h-screen w-screen place-content-center bg-neutral-950/75"
		transition:fade
	>
		<Card outside={close_modal} css={{ card: 'bg-neutral-950 gap-4' }}>
			<Card css={{ card: 'py-2' }}>
				<h5 class="w-full text-lg font-bold">{@html $_('users.auth.recover-password')}</h5>
			</Card>
			<Card>
				<small class="w-full text-start text-sm"
					>{@html $_('users.auth.helpers.recover-password')}</small
				>
			</Card>
			<div class="flex w-full gap-4">
				<Card css={{ card: 'h-10 overflow-clip p-0 flex-row ' }}>
					<button
						class="flex h-10 w-full items-center gap-2 bg-slate-500/25 p-2 text-sm leading-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
						onclick={close_modal}
					>
						<Icon ph="x"></Icon>
						<span>{@html $_('globals.cancel')}</span>
					</button>
				</Card>
				<Card css={{ card: 'h-10  overflow-clip p-0 flex-row ' }}>
					<button
						class="flex h-10 w-full items-center gap-2 bg-red-500/25 p-2 text-sm leading-none transition-all hover:bg-red-500/75 hover:text-neutral-50"
						onclick={handle_reset_password}
					>
						<Icon ph="check-circle"></Icon>
						<span>{@html $_('globals.confirm')}</span>
					</button>
				</Card>
			</div>
		</Card>
	</div>
{/if}
{#if resetMFA_is_open}
	<div
		class="fixed inset-0 z-20 grid h-screen w-screen place-content-center bg-neutral-950/75"
		transition:fade
	>
		<Card outside={close_modal} css={{ card: 'bg-neutral-950 gap-4' }}>
			<Card css={{ card: 'py-2' }}>
				<h5 class="w-full text-lg font-bold">{@html $_('users.auth.reset-mfa')}</h5>
			</Card>
			<Card>
				<small class="w-full text-start text-sm">{@html $_('users.auth.helpers.reset-mfa')}</small>
			</Card>
			<div class="flex w-full gap-4">
				<Card css={{ card: 'h-10 overflow-clip p-0 flex-row ' }}>
					<button
						class="flex h-10 w-full items-center gap-2 bg-slate-500/25 p-2 text-sm leading-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
						onclick={close_modal}
					>
						<Icon ph="x"></Icon>
						<span>{@html $_('globals.cancel')}</span>
					</button>
				</Card>
				<Card css={{ card: 'h-10  overflow-clip p-0 flex-row ' }}>
					<button
						class="flex h-10 w-full items-center gap-2 bg-red-500/25 p-2 text-sm leading-none transition-all hover:bg-red-500/75 hover:text-neutral-50"
						onclick={handle_reset_mfa}
					>
						<Icon ph="check-circle"></Icon>
						<span>{@html $_('globals.confirm')}</span>
					</button>
				</Card>
			</div>
		</Card>
	</div>
{/if}

<Card css={{ card: 'gap-4' }}>
	<div class="flex w-full gap-4">
		<Card css={{ card: 'flex flex-row h-12 md:h-10 items-center justify-between py-2' }}>
			<h4 class="text-lg font-semibold">{@html $_('users.labels.profile')}</h4>
			{#if is_admin === true}
				<span class="flex items-center">
					<span class="pe-2 pt-0.5 text-xs font-bold uppercase tracking-wider">
						{role}
					</span>
					<Icon ph="crown" size={24}></Icon>
				</span>
			{/if}
		</Card>
		<Card css={{ card: 'flex-row h-12  md:h-10 h-full p-0 max-w-max border-none' }}>
			<form action="?/signout" method="post" use:enhance class="contents">
				<button
					class="flex h-12 md:h-10 w-full items-center justify-center gap-2 rounded bg-pink-700/50 p-2 px-4 transition-all hover:bg-pink-700/75 hover:text-neutral-50 focus:bg-pink-700/75"
				>
					<Icon ph="sign-out" size={24}></Icon>
					<small class="text-sm font-semibold">{@html $_('users.actions.logout')}</small>
				</button>
			</form>
		</Card>
	</div>
	<div class="flex w-full flex-col gap-4 lg:flex-row">
		<div class="inline-flex w-full flex-col gap-4">
			<Card css={{ card: 'flex-col items-start' }}>
				<Input
					name="username"
					label={$_('users.fields.username')}
					icons={{
						left: 'user',
						right: (active_field === 'username' && 'floppy-disk') || undefined
					}}
					actions={{
						input: (event) => {
							const element = event.currentTarget;
							debounce(() => {
								if (element.value !== username) element.blur();
							}, 1000)();
						},
						blur: (event) => {
							if (event.currentTarget.value !== username)
								save_this('username', event.currentTarget.value);
						}
					}}
					css={{ 'icon-right': 'animate-pulse' }}
					value={username}
				/>
			</Card>
			<div class="flex gap-4">
				<Card css={{ card: 'flex-col items-center gap-4' }}>
					<Input
						name="email"
						label={$_('users.fields.email')}
						icons={{
							left: 'envelope',
							right: (active_field === 'email' && 'floppy-disk') || undefined
						}}
						value={email}
						css={{ 'icon-right': 'animate-pulse' }}
						actions={{
							input: (e) => {
								const element = e.currentTarget;
								debounce(() => element.blur(), 1000)();
							},
							blur: (e) => {
								if (e.currentTarget.value !== email) save_this('email', e.currentTarget.value);
							}
						}}
					/>
				</Card>

				<Card css={{ card: 'flex-col items-start' }}>
					<Select
						disabled={innerWidth <= 767 || false}
						icons={{ left: 'translate' }}
						placeholder={language_placeholder}
						name="language"
						actions={{
							query: (e) => {
								search_language = e.currentTarget.value;
							},
							select: (e) => {
								const idx = e.currentTarget.dataset.idx;
								if (!idx) return;
								save_this('language', idx, 'settings');
								$locale = idx;
							}
						}}
						label={$_('settings.label.language')}
						items={languages}
						value={language_placeholder}
					></Select>
				</Card>
			</div>
		</div>

		<div class="inline-flex w-full flex-col gap-4">
			<Card css={{ card: 'flex-col items-start h-full' }}>
				<span class="w-full text-sm font-semibold tracking-wider"
					>{@html $_('users.auth.forgot-password')}</span
				>
				<form
					action="?/reset-password"
					id="reset-password"
					hidden
					method="post"
					use:enhance={enhanceResetPassword}
				></form>
				<button
					onclick={open_modal}
					class="flex h-10 w-full items-center justify-center gap-2 rounded border border-slate-500/50 px-2 hover:bg-slate-500 hover:text-neutral-50"
				>
					<Icon ph="key"></Icon>
					<span class="w-full text-start text-sm">{@html $_('users.auth.recover-password')}</span>
				</button>
			</Card>
			<div class="flex flex-col gap-4 md:flex-row">
				<Card>
					<small class="w-full text-sm font-semibold tracking-wider"
						>{@html $_('settings.label.theme')}</small
					>
					<button
						onclick={handle_change_theme}
						class="flex h-10 w-full items-center justify-center rounded border border-slate-500/50 px-2 hover:bg-slate-500 hover:text-neutral-50"
					>
						<span class="w-full text-start text-sm"
							>{@html $_('settings.label.theme-' + (theme || 'dark'))}</span
						>
						<Icon ph={theme === 'light' ? 'sun' : 'moon'}></Icon></button
					>
				</Card>

				<Card>
					<small class="w-full text-sm font-semibold tracking-wider"
						>{@html $_('users.auth.reset-mfa')}</small
					>
					<form
						action="?/reset-mfa"
						id="reset-mfa"
						hidden
						method="post"
						use:enhance={enhanceResetMFA}
					></form>
					<button
						onclick={open_reset_mfa}
						class="flex h-10 w-full items-center justify-center rounded border border-slate-500/50 px-2 hover:bg-red-500 hover:text-neutral-50"
					>
						<span class="w-full text-start text-sm">{@html $_('globals.delete')}</span>
						<Icon ph="lock"></Icon></button
					>
				</Card>
			</div>
		</div>
	</div>
</Card>
