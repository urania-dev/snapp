<script lang="ts">
	import Extralarge from '../../../../../lib/ui/typography/extralarge.svelte';
	import { invalidate, invalidateAll } from '$app/navigation';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	import { toast } from 'svelte-sonner';
	import { enhance, applyAction } from '$app/forms';
	import ActivityIcon from 'lucide-svelte/icons/activity';
	import SaveIcon from 'lucide-svelte/icons/save';
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import ServerIcon from 'lucide-svelte/icons/server';
	import UserIcon from 'lucide-svelte/icons/user';
	import EmailIcon from 'lucide-svelte/icons/mail';
	import UrlsIcon from 'lucide-svelte/icons/link-2';
	import HomeIcon from 'lucide-svelte/icons/home';
	import CircleSlashIcon from 'lucide-svelte/icons/circle-slash';
	import CircleIcon from 'lucide-svelte/icons/circle';
	import DownloadIcon from 'lucide-svelte/icons/download';
	import KeyIcon from 'lucide-svelte/icons/key-square';
	import PortIcon from 'lucide-svelte/icons/door-open';
	import UsersIcon from 'lucide-svelte/icons/users';
	import EyeIcon from 'lucide-svelte/icons/eye';
	import EyeOffIcon from 'lucide-svelte/icons/eye-off';
	import { SlideToggle, getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import Breadcrumbs from '$lib/ui/crumbs/breadcrumbs.svelte';
	import { getLocale } from '$lib/i18n';
	import { H3, ExtraLarge, Lead, Paragraph, Small, Large } from '$lib/ui/typography';
	import type { SubmitFunction } from './$types.js';
	const { t } = getLocale();

	export let data, form;
	let is_saving = false;
	let enable_signup = data.app_settings.signup.enabled;
	let enable_limits = data.app_settings.limits.enabled;
	let disable_home = !data.app_settings.home.enabled;
	let max_urls = data.app_settings.limits.max.urls;
	let max_rpd = data.app_settings.limits.max.rpd;
	let max_rpm = data.app_settings.limits.max.rpm;
	let from = data.app_settings.smtp.from;
	let host = data.app_settings.smtp.host;
	let pass = data.app_settings.smtp.pass;
	let port = data.app_settings.smtp.port;
	let user = data.app_settings.smtp.user;
	let active_smtp = data.active_smtp;
	$: active_smtp = data.active_smtp;

	let show_smtp_pass = false;

	let limits_have_been_edited = false;
	$: limits_have_been_edited =
		max_urls !== data.app_settings.limits.max.urls ||
		max_rpd !== data.app_settings.limits.max.rpd ||
		max_rpm !== data.app_settings.limits.max.rpm;

	let smtp_have_been_edited = false;
	$: smtp_have_been_edited =
		host !== data.app_settings.smtp.host ||
		from !== data.app_settings.smtp.from ||
		port !== data.app_settings.smtp.port ||
		user !== data.app_settings.smtp.user ||
		(pass !== data.app_settings.smtp.pass && pass !== undefined && pass?.trim() !== '');

	function handle_show_smtp_pass() {
		show_smtp_pass = !show_smtp_pass;
	}

	function handle_save_limits() {
		document.forms.namedItem('set-limits')?.requestSubmit();
	}
	function handle_save_smtp() {
		document.forms.namedItem('save-smtp')?.requestSubmit();
	}

	const enhanceSMTP: SubmitFunction = function () {
		return async function ({ result }) {
			await applyAction(result);
			is_saving = false;
			if (result.status === 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'success'
					}
				});
			else if (form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form.message,
						state: 'error'
					}
				});
			await invalidate('snapp:admin:settings');
		};
	};
	const enhanceSwitches: SubmitFunction = function ({ formData }) {
		formData.set('home', disable_home === true ? 'disabled' : 'enabled');
		formData.set('signup', enable_signup === true ? 'enabled' : 'disabled');
		formData.set('limits', enable_limits === true ? 'enabled' : 'disabled');

		return async function ({ result }) {
			await applyAction(result);
			is_saving = false;
			if (result.status === 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'success'
					}
				});
			else if (form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form.message,
						state: 'error'
					}
				});
			await invalidate('snapp:admin:settings');
		};
	};

	const enhanceLimits: SubmitFunction = function ({ formData }) {
		is_saving = true;
		if (max_urls) formData.set('max_urls', `${max_urls}`);
		if (max_rpd) formData.set('max_rpd', `${max_rpd}`);
		if (max_rpm) formData.set('max_rpm', `${max_rpm}`);

		return async function ({ result }) {
			await applyAction(result);
			is_saving = false;
			if (result.status === 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'success'
					}
				});
			else if (form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form.message,
						state: 'error'
					}
				});
			else return;
			await invalidateAll();
			max_urls = data.app_settings.limits.max.urls;
			max_rpd = data.app_settings.limits.max.rpd;
			max_rpm = data.app_settings.limits.max.rpm;
		};
	};

	const modalStore = getModalStore();
	function open_modal_export() {
		const modal: ModalSettings = {
			type: 'confirm',
			buttonTextConfirm: $t('global:misc:confirm'),
			buttonTextCancel: $t('global:misc:cancel'),
			// Data
			title: $t('settings:app:exports:all'),
			body: $t('settings:app:exports:confirm:message'),
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (confirmed: boolean) => {
				if (confirmed === true) {
					const downloadLink = document.createElement('a');
					downloadLink.href = '/dashboard/settings/admin/export';
					downloadLink.download = `export.csv`;
					downloadLink.click();
					downloadLink.remove();
				}
			}
		};
		modalStore.trigger(modal);
	}

	function handle_submit_enter(this: HTMLInputElement, event: KeyboardEvent) {
		const keyEvent = event as KeyboardEvent;
		if (keyEvent.code !== 'Enter' && keyEvent.code !== 'NumpadEnter') return;
		this.form?.requestSubmit();
	}

	function handle_disable_home() {
		is_saving = true;
		document.forms.namedItem('settings')?.requestSubmit();
	}
	function handle_enable_limits() {
		is_saving = true;
		document.forms.namedItem('settings')?.requestSubmit();
	}

	function handle_enable_signup() {
		is_saving = true;
		document.forms.namedItem('settings')?.requestSubmit();
	}

	function reset_form_limits() {
		max_urls = data.app_settings.limits.max.urls;
		max_rpm = data.app_settings.limits.max.rpm;
		max_rpd = data.app_settings.limits.max.rpd;
	}
	function reset_form_smtp() {
		from = data.app_settings.smtp.from;
		host = data.app_settings.smtp.host;
		pass = data.app_settings.smtp.pass;
		port = data.app_settings.smtp.port;
		user = data.app_settings.smtp.user;
	}
</script>

<svelte:head><title>{$t('global:appname')} | {$t('global:pages:admin')}</title></svelte:head>

<form id="settings" action="?/handleSettings" method="post" use:enhance={enhanceSwitches}></form>
<div class="page max-w-5xl">
	<Breadcrumbs
		urls={[
			{ label: $t('global:pages:dashboard'), href: '/dashboard' },
			{ label: $t('global:pages:settings'), href: '/dashboard/settings' },
			{ label: $t('global:pages:admin') }
		]}
	/>
	<div class="flex gap-2 items-center">
		<SettingsIcon class="w-6 h-6" />
		<H3 class="mb-1 w-max">
			{$t('global:pages:admin')}
		</H3>
	</div>

	<div class="grid lg:grid-cols-2 gap-4 transition-[padding]">
		<div class="flex flex-col gap-4">
			<div class="card w-full">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('global:sections:settings:app')}</Lead>
				</div>
				<div class="card-body px-4 pb-4 gap-2 flex flex-col">
					<Paragraph
						>{$t('settings:app:wise')}
						{$t('settings:app:switch')}
					</Paragraph>
					<label for="enable-signup" class="flex flex-col gap-1 mt-4 mb-2">
						<div class="flex w-full justify-between items-center">
							<Paragraph class="font-semibold flex gap-2 items-center">
								<UsersIcon class="w-4 h-4" />
								{$t('settings:app:sign:up:label')}
							</Paragraph>
							<div class="flex items-center justify-end scale-[.8]">
								<SlideToggle
									size="sm"
									id="enable-signup"
									name="enable_signup"
									background="bg-surface-300-600-token"
									active="bg-success-300-600-token"
									disabled={is_saving}
									bind:checked={enable_signup}
									on:change={handle_enable_signup}
								/>
							</div>
						</div>
						<Small>{$t('settings:app:sign:up:description')}</Small>
					</label>
					<label for="enable-homepage" class="flex flex-col gap-1 mt-4 mb-2">
						<div class="flex w-full justify-between items-center">
							<Paragraph class="font-semibold flex gap-2 items-center">
								<HomeIcon class="w-4 h-4" />
								{$t('settings:app:home:label')}
							</Paragraph>
							<div class="flex items-center justify-end scale-[.8]">
								<SlideToggle
									size="sm"
									id="enable-home"
									name="disable_home"
									background="bg-surface-300-600-token"
									active="bg-success-300-600-token"
									disabled={is_saving}
									bind:checked={disable_home}
									on:change={handle_disable_home}
								/>
							</div>
						</div>
						<Small>{$t('settings:app:home:description')}</Small>
					</label>
				</div>
			</div>
			<div class="card w-full">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('global:sections:settings:smtp')}</Lead>
					{#if smtp_have_been_edited}
						<div class="flex gap-2">
							{#if !is_saving}
								<button
									class="btn variant-outline-secondary hover:variant-ghost-secondary justify-center ring-surface-300-600-token h-8 p-0 px-2 flex flex-shrink-0"
									on:click|preventDefault={reset_form_smtp}
								>
									<Paragraph class="font-semibold tracking-wide"
										>{$t('global:misc:revert')}</Paragraph
									>
								</button>
							{/if}
							<button
								class="btn {is_saving
									? 'variant-filled-tertiary animate-pulse'
									: 'variant-outline-secondary hover:variant-ghost-secondary'} justify-center ring-surface-300-600-token h-8 p-0 px-2 flex flex-shrink-0"
								on:click={handle_save_smtp}
							>
								{#if !is_saving}
									<Paragraph class="font-semibold tracking-wide">{$t('global:misc:save')}</Paragraph
									>
								{/if}
								<SaveIcon class="w-4 h-4" strokeWidth="2" />
							</button>
						</div>
					{:else}
						<span class="badge variant-glass-surface flex gap-1 items-center">
							{#if active_smtp}
								<CircleIcon class="h-3 w-3 text-success-500" fill="currentColor" />
								<Small>{$t('settings:app:smtp:active')}</Small>
							{:else}
								<CircleIcon class="h-3 w-3 text-error-500" fill="currentColor" />
								<Small>{$t('settings:app:smtp:not:active')}</Small>
							{/if}
						</span>
					{/if}
				</div>

				<form id="save-smtp" action="?/handleSMTP" method="post" use:enhance={enhanceSMTP}>
					<div class="card-body px-4 pb-4 gap-0">
						<Paragraph>{$t('settings:app:smtp:description')}</Paragraph>
						<label for="host" class="flex flex-col gap-1 mt-4 mb-2">
							<Paragraph class="font-semibold ps-2">{$t('settings:app:smtp:host:label')}</Paragraph>
							<div class="input-group variant-glass input-group-divider grid-cols-[auto_1fr_auto]">
								<div
									class="flex items-center w-10"
									style:padding="0"
									style:justify-content="center"
								>
									<ServerIcon strokeWidth="1.5" class="w-5 h-5" />
								</div>
								<input
									class="input variant-glass rounded-none"
									class:input-error={form?.host === true}
									id="host"
									autocomplete="off"
									aria-autocomplete="none"
									type="text"
									name="host"
									on:keydown={handle_submit_enter}
									placeholder={$t('settings:app:smtp:host:placeholder')}
									bind:value={host}
								/>
							</div>
						</label>
						<label for="port" class="flex flex-col gap-1 mb-2">
							<Paragraph class="font-semibold ps-2">{$t('settings:app:smtp:port:label')}</Paragraph>
							<div class="input-group variant-glass input-group-divider grid-cols-[auto_1fr_auto]">
								<div
									class="flex items-center w-10"
									style:padding="0"
									style:justify-content="center"
								>
									<PortIcon strokeWidth="1.5" class="w-5 h-5" />
								</div>
								<input
									class="input variant-glass rounded-none"
									class:input-error={form?.port === true}
									id="port"
									autocomplete="off"
									aria-autocomplete="none"
									type="text"
									name="port"
									on:keydown={handle_submit_enter}
									placeholder={$t('settings:app:smtp:port:placeholder')}
									bind:value={port}
								/>
							</div>
						</label>
						<label for="user" class="flex flex-col gap-1 mb-2">
							<Paragraph class="font-semibold ps-2">{$t('settings:app:smtp:user:label')}</Paragraph>
							<div class="input-group variant-glass input-group-divider grid-cols-[auto_1fr_auto]">
								<div
									class="flex items-center w-10"
									style:padding="0"
									style:justify-content="center"
								>
									<UserIcon strokeWidth="1.5" class="w-5 h-5" />
								</div>
								<input
									class="input variant-glass rounded-none"
									class:input-error={form?.user === true}
									id="user"
									type="text"
									autocomplete="off"
									aria-autocomplete="none"
									name="user"
									on:keydown={handle_submit_enter}
									placeholder={$t('settings:app:smtp:user:placeholder')}
									bind:value={user}
								/>
							</div>
						</label>
						<label for="pass" class="flex flex-col gap-1 mb-2">
							<Paragraph class="font-semibold ps-2">{$t('settings:app:smtp:pass:label')}</Paragraph>
							<div class="input-group variant-glass input-group-divider grid-cols-[auto_1fr_auto]">
								<div
									class="flex items-center w-10"
									style:padding="0"
									style:justify-content="center"
								>
									<KeyIcon strokeWidth="1.5" class="w-5 h-5" />
								</div>
								{#if show_smtp_pass === true}
									<input
										class="input variant-glass rounded-none"
										class:input-error={form?.pass === true}
										autocomplete="off"
										aria-autocomplete="none"
										id="pass"
										type="text"
										name="pass"
										on:keydown={handle_submit_enter}
										placeholder={$t('settings:app:smtp:pass:placeholder')}
										bind:value={pass}
									/>
								{:else}
									<input
										class="input variant-glass rounded-none"
										class:input-error={form?.pass === true}
										autocomplete="off"
										aria-autocomplete="none"
										id="pass"
										type="password"
										name="pass"
										on:keydown={handle_submit_enter}
										placeholder={$t('settings:app:smtp:pass:placeholder')}
										bind:value={pass}
									/>
								{/if}
								<div class="w-10 h-10 flex" style:padding="0">
									<button
										tabindex="-1"
										class="w-10"
										style:justify-content="center"
										style:padding="0"
										on:click|preventDefault={handle_show_smtp_pass}
									>
										{#if show_smtp_pass === false}
											<EyeIcon strokeWidth="1.5" class="w-5 h-5" />
										{:else}
											<EyeOffIcon strokeWidth="1.5" class="w-5 h-5" />
										{/if}
									</button>
								</div>
							</div>
						</label>
						<label for="from" class="flex flex-col gap-1 mb-2">
							<Paragraph class="font-semibold ps-2">{$t('settings:app:smtp:from:label')}</Paragraph>
							<div class="input-group variant-glass input-group-divider grid-cols-[auto_1fr_auto]">
								<div
									class="flex items-center w-10"
									style:padding="0"
									style:justify-content="center"
								>
									<EmailIcon strokeWidth="1.5" class="w-5 h-5" />
								</div>
								<input
									class="input variant-glass rounded-none"
									class:input-error={form?.from === true}
									id="from"
									type="text"
									name="from"
									autocomplete="off"
									aria-autocomplete="none"
									on:keydown={handle_submit_enter}
									placeholder={$t('settings:app:smtp:from:placeholder')}
									bind:value={from}
								/>
							</div>
						</label>
					</div>
				</form>
			</div>
		</div>
		<div class="flex flex-col gap-4 h-full">
			<div class="card w-full">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('global:sections:settings:limits')}</Lead>
					{#if limits_have_been_edited}
						<div class="flex gap-2">
							{#if !is_saving}
								<button
									class="btn variant-outline-secondary hover:variant-ghost-secondary justify-center ring-surface-300-600-token h-8 p-0 px-2 flex flex-shrink-0"
									on:click|preventDefault={reset_form_limits}
								>
									<Paragraph class="font-semibold tracking-wide"
										>{$t('global:misc:revert')}</Paragraph
									>
								</button>
							{/if}
							<button
								class="btn {is_saving
									? 'variant-filled-tertiary animate-pulse'
									: 'variant-outline-secondary hover:variant-ghost-secondary'} justify-center ring-surface-300-600-token h-8 p-0 px-2 flex flex-shrink-0"
								on:click={handle_save_limits}
							>
								{#if !is_saving}
									<Paragraph class="font-semibold tracking-wide">{$t('global:misc:save')}</Paragraph
									>
								{/if}
								<SaveIcon class="w-4 h-4" strokeWidth="2" />
							</button>
						</div>
					{:else}
						<div class="flex items-center justify-end scale-[.8]">
							<SlideToggle
								size="sm"
								id="enable-limits"
								name="enable_limitts"
								background="bg-surface-300-600-token"
								active="bg-success-300-600-token"
								disabled={is_saving}
								bind:checked={enable_limits}
								on:change={handle_enable_limits}
							/>
						</div>
					{/if}
				</div>
				<form action="?/handleLimits" id="set-limits" use:enhance={enhanceLimits} method="post">
					<div class="card-body flex flex-col p-4 gap-4">
						<Paragraph>{@html $t('settings:app:user:limits:description')}</Paragraph>
						<label for="max_urls" class="flex flex-col lg:flex-row gap-1 mb-2">
							<div class="flex flex-col">
								<Paragraph class="font-semibold"
									>{$t('settings:app:user:limits:max:urls:label')}</Paragraph
								>
								<Small class="mt-1">{$t('settings:app:user:limits:max:urls:description')}</Small>
							</div>
							<div
								class="input-group variant-glass h-10 sm:mt-0 mt-1 lg:w-24 ms-auto flex-grow-0 input-group-divider grid-cols-[auto_1fr_auto]"
							>
								<div
									class="flex items-center w-10"
									style:padding="0"
									style:justify-content="center"
								>
									<UrlsIcon strokeWidth="1.5" class="w-5 h-5" />
								</div>
								<input
									class="input variant-glass rounded-none text-right flex flex-grow-0"
									on:keydown={handle_submit_enter}
									id="max_urls"
									autocomplete="off"
									aria-autocomplete="none"
									class:input-disabled={!data.app_settings.limits.enabled}
									disabled={!data.app_settings.limits.enabled}
									type="text"
									name="max_urls"
									placeholder={$t('settings:app:user:limits:max:placeholder')}
									bind:value={max_urls}
								/>
							</div>
						</label>
						<label for="max_rpd" class="flex flex-col lg:flex-row gap-1 mb-2">
							<div class="flex flex-col">
								<Paragraph class="font-semibold"
									>{$t('settings:app:user:limits:max:rpd:label')}</Paragraph
								>
								<Small class="mt-1">{$t('settings:app:user:limits:max:rpd:description')}</Small>
							</div>
							<div
								class="input-group variant-glass h-10 sm:mt-0 mt-1 lg:w-24 ms-auto flex-grow-0 input-group-divider grid-cols-[auto_1fr_auto]"
							>
								<div
									class="flex items-center w-10"
									style:padding="0"
									style:justify-content="center"
								>
									<ActivityIcon strokeWidth="1.5" class="w-5 h-5" />
								</div>
								<input
									class="input variant-glass rounded-none text-right flex flex-grow-0"
									on:keydown={handle_submit_enter}
									id="max_rpd"
									type="text"
									class:input-disabled={!data.app_settings.limits.enabled}
									disabled={!data.app_settings.limits.enabled}
									autocomplete="off"
									aria-autocomplete="none"
									name="max_rpd"
									placeholder={$t('settings:app:user:limits:max:placeholder')}
									bind:value={max_rpd}
								/>
							</div>
						</label>
						<label for="max_rpm" class="flex flex-col lg:flex-row gap-1 mb-2">
							<div class="flex flex-col">
								<Paragraph class="font-semibold"
									>{$t('settings:app:user:limits:max:rpm:label')}</Paragraph
								>
								<Small class="mt-1">{$t('settings:app:user:limits:max:rpm:description')}</Small>
							</div>
							<div
								class="input-group variant-glass h-10 sm:mt-0 mt-1 lg:w-24 ms-auto flex-grow-0 input-group-divider grid-cols-[auto_1fr_auto]"
							>
								<div
									class="flex items-center w-10"
									style:padding="0"
									style:justify-content="center"
								>
									<ActivityIcon strokeWidth="1.5" class="w-5 h-5" />
								</div>
								<input
									class="input variant-glass rounded-none text-right flex flex-grow-0"
									on:keydown={handle_submit_enter}
									id="max_rpm"
									class:input-disabled={!data.app_settings.limits.enabled}
									disabled={!data.app_settings.limits.enabled}
									autocomplete="off"
									aria-autocomplete="none"
									type="text"
									name="max_rpm"
									placeholder={$t('settings:app:user:limits:max:placeholder')}
									bind:value={max_rpm}
								/>
							</div>
						</label>
					</div>
				</form>
			</div>
			<div class="card w-full">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('global:sections:settings:export')}</Lead>
					<button
						class="btn variant-outline-secondary hover:variant-ghost-secondary h-8 px-2 min-w-24 max-w-max"
						on:click={open_modal_export}
					>
						<DownloadIcon class="h-4 w-4" />
						<Small class="font-semibold">{$t('global:misc:download')}</Small>
					</button>
				</div>
				<div class="card-body flex flex-col px-4 pb-4 gap-4">
					<Paragraph>{$t('settings:app:exports:helper')}</Paragraph>
				</div>
			</div>
			<div class="card w-full h-full flex-grow">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('global:sections:settings:blacklist')}</Lead>
					<a
						class="btn variant-outline-secondary hover:variant-ghost-secondary max-w-max min-w-24 px-2"
						href="/dashboard/settings/admin/blacklists"
					>
						<CircleSlashIcon class="h-4 w-4" />
						<Small class="font-semibold">{$t('global:pages:blacklists')}</Small>
					</a>
				</div>
				<div class="card-body px-4 pb-4 flex flex-col flex-grow-1">
					<div class="flex flex-col flex-grow-1 mb-auto">
						<Paragraph>{$t('settings:app:blacklists:description')}</Paragraph>
					</div>
					<div class="grid grid-cols-2 gap-4 mt-8 flex-grow-1">
						<div class="badge variant-glass-warning inline-flex">
							<Large>{data.app_settings.banlists.websites}</Large>
							<Small class="font-semibold text-center flex whitespace-break-spaces"
								>{$t('settings:app:blacklists:meta:domains:label')}</Small
							>
						</div>
						<div class="badge variant-glass-warning inline-flex">
							<Large>{data.app_settings.banlists.emails}</Large>
							<Small class="font-semibold text-center whitespace-break-spaces"
								>{$t('settings:app:blacklists:meta:emails:label')}</Small
							>
						</div>
						<div class="badge variant-glass-warning inline-flex">
							<Large>{data.app_settings.banlists.usernames}</Large>
							<Small class="font-semibold text-center whitespace-break-spaces"
								>{$t('settings:app:blacklists:meta:usernames:label')}</Small
							>
						</div>
						<div class="badge variant-glass-warning inline-flex">
							<Large>{data.app_settings.whitelists.emails}</Large>
							<Small class="font-semibold text-center whitespace-break-spaces"
								>{$t('settings:app:whitelists:meta:emails:label')}</Small
							>
						</div>
					</div>

					{#if data.vtapikey === true}
						<span
							class="badge variant-glass-surface flex gap-1 items-center max-w-max me-auto mt-4"
						>
							<CircleIcon class="h-3 w-3 text-success-500" fill="currentColor" />
							<Small>{$t('settings:api:key:vt:protected')}</Small>
						</span>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	#max_urls,
	#max_rpd,
	#max_rpm {
		min-width: unset !important;
	}
</style>
