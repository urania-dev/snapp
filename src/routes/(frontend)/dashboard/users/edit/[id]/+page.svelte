<script lang="ts">
	import { slugify } from '$lib/utils/slugify/index';
	import GlobeIcon from 'lucide-svelte/icons/globe';
	import PlusIcon from 'lucide-svelte/icons/plus-circle';
	import UrlsIcon from 'lucide-svelte/icons/link-2';
	import InfoIcon from 'lucide-svelte/icons/info';
	import AdminIcon from 'lucide-svelte/icons/crown';
	import SaveIcon from 'lucide-svelte/icons/save';
	import { applyAction, enhance } from '$app/forms';
	import { getLocale } from '$lib/i18n/index.js';
	import Breadcrumbs from '$lib/ui/crumbs/breadcrumbs.svelte';
	import { H3, Lead, Paragraph, Small } from '$lib/ui/typography';
	import { SlideToggle, popup, type PopupSettings } from '@skeletonlabs/skeleton';
	import type { SubmitFunction } from './$types.js';
	import { toast } from 'svelte-sonner';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	import { goto, invalidateAll } from '$app/navigation';

	export let data, form;
	let username: string | undefined = data.user.username as string | undefined;
	let email: string | undefined = data.user.email as string | undefined;
	let max_urls: number | undefined = data.app_settings.limits.max.urls;
	let notes: string | undefined = data.notes;
	let is_admin: boolean = data.isAdmin === true ?? false;
	const { t } = getLocale();

	function slugify_username(this: HTMLInputElement) {
		return (this.value = slugify(this.value));
	}

	function handle_enter_submit(e: Event) {
		const keyEvent = e as KeyboardEvent;
		if (keyEvent.code !== 'Enter' && keyEvent.code !== 'NumpadEnter') return;
		document.forms.namedItem('update')?.requestSubmit();
	}
	const noteInfoTooltip = {
		event: 'hover',
		target: 'noteInfoTooltip',
		placement: 'left'
	} satisfies PopupSettings;

	const enhanceCreateUser: SubmitFunction = function ({ formData }) {
		if (username) formData.set('username', username);
		if (email) formData.set('email', email);
		if (is_admin === true) formData.set('is_admin', String(is_admin));
		if (is_admin === false) formData.set('is_admin', String(is_admin));
		if (notes) formData.set('notes', notes);
		if (max_urls) formData.set('max_urls', String(max_urls));

		return async function ({ result }) {
			await applyAction(result);
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

			await invalidateAll();
			if (result.status === 200) await goto('/dashboard/users');
		};
	};

	function handle_save_user() {
		document.forms.namedItem('update')?.requestSubmit();
	}
</script>

<svelte:head
	><title>{$t('global:appname')} | {$t('global:pages:user', { id: data.user.id })}</title
	></svelte:head
>

<div data-popup="noteInfoTooltip">
	<div class="flex card variant-filled-secondary p-2 z-20">
		<Small>
			{$t('users:notes:helper')}
		</Small>
	</div>
</div>
<form id="update" method="post" action="?/update" use:enhance={enhanceCreateUser} />
<div class="page">
	<Breadcrumbs
		urls={[
			{ label: $t('global:pages:dashboard'), href: '/dashboard' },
			{ label: $t('global:pages:users'), href: '/dashboard/users' },
			{ label: $t('global:sections:user:create') + ': ' + username }
		]}
	/>
	<div class="flex gap-2 items-center">
		<PlusIcon class="w-6 h-6" />
		<H3 class="mb-1 w-max">
			{$t('global:sections:user:edit')}
		</H3>
	</div>
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
		<div class="flex flex-col gap-4 w-full">
			<div class="card w-full">
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('global:sections:user:create:header')}</Lead>
				</div>
				<div class="card-body px-4 pb-4 flex flex-col gap-4">
					<label for="username" class="flex flex-col gap-1">
						<Paragraph class="font-semibold">{$t('users:username:label')}</Paragraph>
						<div class="input-group max-w-sm input-group-divider grid-cols-[auto_1fr_auto]">
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<GlobeIcon strokeWidth="1.5" class="w-5 h-5" />
							</div>
							<input
								class="input rounded-none"
								id="username"
								on:keydown={handle_enter_submit}
								type="text"
								on:input={slugify_username}
								name="username"
								placeholder={$t('users:username:placeholder')}
								bind:value={username}
							/>
						</div>
						<Small class="mt-1">{@html $t('users:username:helper')}</Small>
					</label>
					<label for="email" class="flex flex-col gap-1">
						<Paragraph class="font-semibold">{$t('users:email:label')}</Paragraph>
						<div class="input-group max-w-sm input-group-divider grid-cols-[auto_1fr_auto]">
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<GlobeIcon strokeWidth="1.5" class="w-5 h-5" />
							</div>
							<input
								class="input rounded-none"
								id="email"
								on:keydown={handle_enter_submit}
								type="text"
								name="email"
								placeholder={$t('users:email:placeholder')}
								bind:value={email}
							/>
						</div>
						<Small class="mt-1">{@html $t('users:email:helper')}</Small>
					</label>
				</div>
			</div>
			<div class="card w-full">
				<div class="card-header">
					<Lead>
						{$t('users:advanced:settings')}
					</Lead>
				</div>
				<div class="card-body flex flex-col pb-4 px-4 gap-4">
					<label for="isadmin" class="flex flex-col gap-1 mt-4 mb-2">
						<div class="flex w-full justify-between items-center">
							<Paragraph class="font-semibold flex gap-2 items-center">
								<AdminIcon class="w-4 h-4" />
								{$t('users:advanced:settings:admin:label')}
							</Paragraph>
							<div class="flex items-center justify-end scale-[.8]">
								<SlideToggle
									size="sm"
									id="isadmin"
									name="isadmin"
									background="bg-surface-300-600-token"
									active="bg-success-300-600-token"
									bind:checked={is_admin}
								/>
							</div>
						</div>
						<Small>{$t('users:advanced:settings:admin:description')}</Small>
					</label>
					<label for="max_urls" class="flex flex-col md:flex-row gap-1 mb-2">
						<div class="flex flex-col">
							<Paragraph class="font-semibold"
								>{$t('settings:app:user:limits:max:urls:label')}</Paragraph
							>
							<Small class="mt-1">{$t('settings:app:user:limits:max:urls:description')}</Small>
						</div>
						<div
							class="input-group variant-glass h-10 sm:mt-0 mt-1 md:w-24 ms-auto flex-grow-0 input-group-divider grid-cols-[auto_1fr_auto]"
						>
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<UrlsIcon strokeWidth="1.5" class="w-5 h-5" />
							</div>
							<input
								class="input variant-glass rounded-none text-right flex flex-grow-0"
								id="max_urls"
								class:input-disabled={!data.app_settings?.limits?.enabled}
								disabled={!data.app_settings?.limits?.enabled || is_admin === true}
								on:keydown={handle_enter_submit}
								type="text"
								name="max_urls"
								placeholder={$t('settings:app:user:limits:max:placeholder')}
								title={is_admin === true ? $t('users:advanced:settings:admin:privilege') : ''}
								bind:value={max_urls}
							/>
						</div>
					</label>
				</div>
			</div>
		</div>
		<div class="flex flex-col gap-4 w-full min-h-60">
			<div
				class="card w-full
					 flex flex-col flex-grow"
			>
				<div class="card-header flex items-center justify-between h-14 py-0">
					<Lead>{$t('users:notes:label')}</Lead>

					<button use:popup={noteInfoTooltip}>
						<InfoIcon class="w-4 h-4" />
					</button>
				</div>
				<div class="card-body full flex-grow hide-scrollbar flex gap-4 ps-[1px] pe-[1px] pb-[1px]">
					<textarea
						name="notes"
						class="textarea border-r-0 border-l-0 border-b-0 rounded-tl-none rounded-tr-none"
						bind:value={notes}
					/>
				</div>
			</div>
		</div>
	</div>
	<div class="flex card p-4 mb-4">
		<button
			class="btn ms-auto variant-glass-primary hover:variant-filled-primary flex gap-2 items-center"
			on:click={handle_save_user}
		>
			<SaveIcon class="w-4 h-4" />
			<Small>
				{$t('global:misc:save')}
			</Small>
		</button>
	</div>
</div>
