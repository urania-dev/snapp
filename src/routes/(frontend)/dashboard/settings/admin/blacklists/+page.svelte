<script lang="ts">
	import SaveIcon from 'lucide-svelte/icons/save';
	import { applyAction, enhance } from '$app/forms';
	import Breadcrumbs from '$lib/ui/crumbs/breadcrumbs.svelte';
	import { getLocale } from '$lib/i18n';
	import { H3, Lead, Paragraph, Small } from '$lib/ui/typography';
	import {
		getModalStore,
		Table,
		tableMapperValues,
		type ModalComponent,
		type TableSource,
		type ModalSettings,
		type PaginationSettings,
		Paginator
	} from '@skeletonlabs/skeleton';
	import { toast } from 'svelte-sonner';
	import PlusIcon from 'lucide-svelte/icons/plus-circle';
	import CircleSlashIcon from 'lucide-svelte/icons/circle-slash';
	import EyeOffIcon from 'lucide-svelte/icons/eye-off';
	import EyeIcon from 'lucide-svelte/icons/eye';
	import KeyIcon from 'lucide-svelte/icons/key-square';
	import ArrowDownIcon from 'lucide-svelte/icons/arrow-down';
	import ShieldBanIcon from 'lucide-svelte/icons/shield-ban';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	import BanDomain from '$lib/ui/modals/ban-domain.svelte';
	import BanUsername from '$lib/ui/modals/ban-username.svelte';
	import BanEmail from '$lib/ui/modals/ban-email.svelte';
	import AddEmail from '$lib/ui/modals/add-email.svelte';
	import type { SubmitFunction } from './$types.js';
	import { invalidateAll } from '$app/navigation';

	const { t } = getLocale();

	export let data, form;
	const modalStore = getModalStore();

	let sourceDataDomain = data.banlists.websites.map((item, idx) => ({ item, idx }));
	let sourceDataUsername = data.banlists.usernames.map((item, idx) => ({ item, idx }));
	let sourceDataEmail = data.banlists.emails.map((item, idx) => ({ item, idx }));
	let sourceDataWhiteEmail = data.whitelists.emails.map((item, idx) => ({ item, idx }));

	$: sourceDataDomain = data.banlists.websites.map((item, idx) => ({ item, idx }));
	$: sourceDataUsername = data.banlists.usernames.map((item, idx) => ({ item, idx }));
	$: sourceDataEmail = data.banlists.emails.map((item, idx) => ({ item, idx }));
	$: sourceDataWhiteEmail = data.whitelists.emails.map((item, idx) => ({ item, idx }));

	function setUpTable(
		source: { idx: number; item: string }[],
		limit: number = 4,
		page: number = 0,
		label: string = ''
	) {
		const start = page * limit;
		const end = start + limit;
		let _source: typeof source = [];
		const remainder = source.length % limit;
		const additionalItems = remainder !== 0 || source.length === 0 ? limit - remainder : 0;
		if (remainder !== 0 || source.length === 0) {
			_source = [
				...source,
				...Array.from({ length: additionalItems }, (_, idx) => ({
					item: '',
					idx: source.length + idx
				}))
			];
		} else {
			_source = source;
		}
		return {
			head: [label],
			body: tableMapperValues(_source.slice(start, end), ['item']),
			meta: tableMapperValues(_source.slice(start, end), ['item', 'idx']),
			foot: []
		} satisfies TableSource;
	}
	let limit = 4;
	let domainPage = 0;
	let usernamePage = 0;
	let emailPage = 0;
	let emailWhitePage = 0;
	let paginationDomainSettings = {
		page: domainPage,
		limit,
		size: sourceDataDomain.length + ((limit - (sourceDataDomain.length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;

	function handle_change_page_domain(e: CustomEvent) {
		domainPage = e.detail;
	}
	let paginationEmailSettings = {
		page: emailPage,
		limit,
		size: sourceDataEmail.length + ((limit - (sourceDataEmail.length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;

	function handle_change_page_email(e: CustomEvent) {
		emailPage = e.detail;
	}

	function handle_change_page_white_email(e: CustomEvent) {
		emailPage = e.detail;
	}

	let paginationWhiteEmailSettings = {
		page: emailWhitePage,
		limit,
		size: sourceDataWhiteEmail.length + ((limit - (sourceDataWhiteEmail.length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;

	function handle_change_page_username(e: CustomEvent) {
		emailPage = e.detail;
	}

	let paginationUsernameSettings = {
		page: domainPage,
		limit,
		size: sourceDataUsername.length + ((limit - (sourceDataUsername.length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;

	let tableDomain = setUpTable(sourceDataDomain, limit, domainPage, 'domain');
	let tableEmail = setUpTable(sourceDataEmail, limit, emailPage, 'email');
	let tableUsername = setUpTable(sourceDataUsername, 2, usernamePage, 'username');
	let tableWhiteEmail = setUpTable(sourceDataWhiteEmail, 2, emailWhitePage, 'email');
	$: tableDomain = setUpTable(sourceDataDomain, limit, domainPage, 'domain');
	$: tableEmail = setUpTable(sourceDataEmail, limit, emailPage, 'email');
	$: tableWhiteEmail = setUpTable(sourceDataWhiteEmail, 2, emailWhitePage, 'email');
	$: tableUsername = setUpTable(sourceDataUsername, 2, usernamePage, 'username');

	let selectedDomain: string;
	let selectedEmail: string;
	let selectedUsername: string;

	function handle_select_website(row: CustomEvent) {
		selectedDomain = row.detail?.[0];
		if (!selectedDomain) return;
		handle_modal_confirm_domain();
	}
	function handle_select_username(row: CustomEvent) {
		selectedUsername = row.detail?.[0];
		if (!selectedUsername) return;
		handle_modal_confirm_username();
	}
	function handle_select_email(row: CustomEvent) {
		selectedEmail = row.detail?.[0];
		if (!selectedEmail) return;
		handle_modal_confirm_email();
	}
	function handle_select_email_white(row: CustomEvent) {
		selectedEmail = row.detail?.[0];
		if (!selectedEmail) return;
		handle_modal_confirm_email_white();
	}

	const enhanceDomainUnBan: SubmitFunction = function ({ formData, cancel }) {
		if (selectedDomain) formData.set('domain', selectedDomain);
		else cancel();

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
			sourceDataDomain = data.banlists.websites.map((item, idx) => ({
				item,
				idx
			}));
		};
	};
	const enhanceUsernameUnBan: SubmitFunction = function ({ formData, cancel }) {
		if (selectedUsername) formData.set('username', selectedUsername);
		else cancel();

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
			sourceDataUsername = data.banlists.usernames.map((item, idx) => ({
				item,
				idx
			}));
		};
	};
	const enhanceEmailUnBan: SubmitFunction = function ({ formData, cancel }) {
		if (selectedEmail) formData.set('email', selectedEmail);
		else cancel();

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
			sourceDataEmail = data.banlists.emails.map((item, idx) => ({
				item,
				idx
			}));
		};
	};

	const enhanceEmailWhitelist: SubmitFunction = function ({ formData, cancel }) {
		if (selectedEmail) formData.set('email', selectedEmail);
		else cancel();

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
			sourceDataWhiteEmail = data.whitelists.emails.map((item, idx) => ({
				item,
				idx
			}));
		};
	};

	function handle_modal_confirm_domain() {
		const modal: ModalSettings = {
			type: 'confirm',
			buttonTextConfirm: $t('global:misc:confirm'),
			buttonTextCancel: $t('global:misc:cancel'),
			// Data
			title: $t('settings:app:blacklists:domain:remove'),
			body: $t('settings:app:blacklists:domain:remove:message'),
			// TRUE if confirm pressed, FALSE if cancel pressed

			response: (confirmed: boolean) => {
				if (confirmed === true) document.forms.namedItem('unban-domain')?.requestSubmit();
			}
		};
		modalStore.trigger(modal);
	}
	function handle_modal_confirm_email() {
		const modal: ModalSettings = {
			type: 'confirm',
			buttonTextConfirm: $t('global:misc:confirm'),
			buttonTextCancel: $t('global:misc:cancel'),
			// Data
			title: $t('settings:app:blacklists:email:remove'),
			body: $t('settings:app:blacklists:email:remove:message'),
			// TRUE if confirm pressed, FALSE if cancel pressed

			response: (confirmed: boolean) => {
				if (confirmed === true) document.forms.namedItem('unban-email')?.requestSubmit();
			}
		};
		modalStore.trigger(modal);
	}
	function handle_modal_confirm_email_white() {
		const modal: ModalSettings = {
			type: 'confirm',
			buttonTextConfirm: $t('global:misc:confirm'),
			buttonTextCancel: $t('global:misc:cancel'),
			// Data
			title: $t('settings:app:whitelists:email:remove'),
			body: $t('settings:app:whitelists:email:remove:message'),
			// TRUE if confirm pressed, FALSE if cancel pressed

			response: (confirmed: boolean) => {
				if (confirmed === true) document.forms.namedItem('unwhite-email')?.requestSubmit();
			}
		};
		modalStore.trigger(modal);
	}
	function handle_modal_confirm_username() {
		const modal: ModalSettings = {
			type: 'confirm',
			buttonTextConfirm: $t('global:misc:confirm'),
			buttonTextCancel: $t('global:misc:cancel'),
			// Data
			title: $t('settings:app:blacklists:username:remove'),
			body: $t('settings:app:blacklists:username:remove:message'),
			// TRUE if confirm pressed, FALSE if cancel pressed

			response: (confirmed: boolean) => {
				if (confirmed === true) document.forms.namedItem('unban-username')?.requestSubmit();
			}
		};
		modalStore.trigger(modal);
	}

	function handle_modal_ban_domain() {
		const modalComponent: ModalComponent = { ref: BanDomain };

		const modal: ModalSettings = {
			type: 'component',
			component: modalComponent
		};
		modalStore.trigger(modal);
	}

	function handle_modal_add_email() {
		const modalComponent: ModalComponent = { ref: AddEmail };

		const modal: ModalSettings = {
			type: 'component',
			component: modalComponent
		};
		modalStore.trigger(modal);
	}

	function handle_modal_ban_email() {
		const modalComponent: ModalComponent = { ref: BanEmail };

		const modal: ModalSettings = {
			type: 'component',
			component: modalComponent
		};
		modalStore.trigger(modal);
	}
	function handle_modal_ban_username() {
		const modalComponent: ModalComponent = { ref: BanUsername };

		const modal: ModalSettings = {
			type: 'component',
			component: modalComponent
		};
		modalStore.trigger(modal);
	}

	let vt_api_key: string | undefined = data.vtapikey;

	const enhanceVTAPIKey: SubmitFunction = function () {
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
			if (form?.vtapikey) vt_api_key = form.vtapikey;
			await invalidateAll();
		};
	};

	function handle_submit_apikey() {
		if (vt_api_key && vt_api_key !== data.vtapikey)
			document.forms.namedItem('vt-api-key')?.requestSubmit();
	}

	let show_vt_api_key = false;

	function handle_show_vt_api_key() {
		show_vt_api_key = !show_vt_api_key;
	}
	let show_api = false;

	function handle_show_api() {
		show_api = !show_api;
	}
</script>

<form
	action="?/unWhiteEmail"
	method="post"
	id="unwhite-email"
	use:enhance={enhanceEmailWhitelist}
/>
<form action="?/unBanDomain" method="post" id="unban-domain" use:enhance={enhanceDomainUnBan} />
<form action="?/unBanEmail" method="post" id="unban-email" use:enhance={enhanceEmailUnBan} />
<form
	action="?/unBanUsername"
	method="post"
	id="unban-username"
	use:enhance={enhanceUsernameUnBan}
/>

<svelte:head><title>{$t('global:appname')} | {$t('global:pages:blacklists')}</title></svelte:head>

<div
	class="page h-full"
>
	<Breadcrumbs
		urls={[
			{ label: $t('global:pages:dashboard'), href: '/dashboard' },
			{ label: $t('global:pages:settings'), href: '/dashboard/settings' },
			{ label: $t('global:pages:admin'), href: '/dashboard/settings/admin' },
			{ label: $t('global:pages:blacklists') }
		]}
	/>
	<div class="flex gap-2 items-center">
		<CircleSlashIcon class="w-6 h-6" />
		<H3 class="mb-1 w-max">
			{$t('global:pages:blacklists')}
		</H3>
	</div>

	<div class="flex flex-col gap-0 transition-[padding] card w-full">
		<div class="card-header flex items-center justify-between h-14 py-0">
			<div class="flex items-center gap-2">
				<ShieldBanIcon class="w-6 h-6" />
				<Lead>{$t('settings:api:key:vt')}</Lead>
			</div>
			<div class="flex ms-auto gap-4">
				{#if data.vtapikey !== vt_api_key}
					<button
						class="btn gap-2 variant-outline-secondary hover:variant-ghost-secondary"
						on:click={handle_submit_apikey}
					>
						<SaveIcon class="h-4 w-4" />
						{$t('global:misc:save')}
					</button>
				{/if}
				<button
					class="btn gap-2 h-8 w-8 p-0 variant-outline-secondary hover:variant-ghost-secondary"
					on:click={handle_show_vt_api_key}
				>
					<ArrowDownIcon class="h-4 w-4 transition-all {show_vt_api_key ? 'rotate-180' : ''}" />
				</button>
			</div>
		</div>
		{#if show_vt_api_key}
			<div class="card-body px-4 grid lg:grid-cols-2 gap-10">
				<label for="host" class="flex flex-col gap-1 h-full pb-4">
					<Paragraph class="font-semibold ps-2">{$t('settings:api:key:vt:label')}</Paragraph>
					<form id="vt-api-key" method="post" action="?/vtApiKey" use:enhance={enhanceVTAPIKey}>
						<div class="input-group variant-glass input-group-divider grid-cols-[auto_1fr_auto]">
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<KeyIcon strokeWidth="1.5" class="w-5 h-5" />
							</div>
							{#if show_api}
								<input
									class="input variant-glass"
									id="host"
									type="text"
									name="apikey"
									placeholder={$t('settings:api:key:vt:placeholder')}
									bind:value={vt_api_key}
								/>
							{:else}
								<input
									class="input variant-glass"
									id="host"
									type="password"
									name="apikey"
									placeholder={$t('settings:api:key:vt:placeholder')}
									bind:value={vt_api_key}
								/>
							{/if}
							<div class="w-10 h-10 flex" style:padding="0">
								<button
									tabindex="-1"
									class="w-10 h-10"
									style:justify-content="center"
									style:padding="0"
									on:click|preventDefault={handle_show_api}
								>
									{#if show_api === false}
										<EyeIcon strokeWidth="1.5" class="w-5 h-5" />
									{:else}
										<EyeOffIcon strokeWidth="1.5" class="w-5 h-5" />
									{/if}
								</button>
							</div>
						</div>
						<Small>{$t('settings:api:key:vt:helper:text')}</Small>
					</form>
				</label>
				<Paragraph class="mt-4">{@html $t('settings:api:key:vt:description')}</Paragraph>
			</div>
		{/if}
	</div>
	<div class="grid lg:grid-cols-2 gap-4 transition-[padding] mb-2">
		<div class="card w-full">
			<div class="card-header flex items-center justify-between h-14 py-0">
				<Lead>{$t('settings:app:blacklists:meta:domains:label')}</Lead>
				<button
					class="btn variant-outline-secondary hover:variant-ghost-secondary min-w-24 h-8 flex items-center gap-0 p-2"
					on:click|stopPropagation={handle_modal_ban_domain}
				>
					<PlusIcon class="w-4 h-4" />
					<Small class="font-semibold">
						{$t('settings:app:blacklists:domain:add')}
					</Small>
				</button>
			</div>
			<div class="card-body flex flex-col px-4">
				<Paragraph>{$t('settings:app:blacklists:domain:description')}</Paragraph>
			</div>
			<div class="card-body flex flex-col p-[1px] rounded-none">
				<Table
					text="rounded-none variant-glass"
					class="rounded-none"
					regionHead="variant-glass"
					source={tableDomain}
					interactive={true}
					on:selected={handle_select_website}
				/>
			</div>
			<div class="card-footer flex flex-col p-2 mt-auto">
				<Paginator
					on:page={handle_change_page_domain}
					class="ms-auto"
					bind:settings={paginationDomainSettings}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
		<div class="card w-full">
			<div class="card-header flex items-center justify-between h-14 py-0">
				<Lead>{$t('settings:app:blacklists:meta:emails:label')}</Lead>
				<button
					class="btn variant-outline-secondary hover:variant-ghost-secondary min-w-24 h-8 flex items-center gap-0 p-2"
					on:click|stopPropagation={handle_modal_ban_email}
				>
					<PlusIcon class="w-4 h-4" />
					<Small class="font-semibold">
						{$t('settings:app:blacklists:email:add')}
					</Small>
				</button>
			</div>
			<div class="card-body flex flex-col px-4">
				<Paragraph>{$t('settings:app:blacklists:email:description')}</Paragraph>
			</div>
			<div class="card-body flex flex-col p-[1px] rounded-none">
				<Table
					text="rounded-none variant-glass"
					class="rounded-none"
					regionHead="variant-glass"
					source={tableEmail}
					interactive={true}
					on:selected={handle_select_email}
				/>
			</div>
			<div class="card-footer flex flex-col p-2 mt-auto">
				<Paginator
					on:page={handle_change_page_email}
					class="ms-auto"
					bind:settings={paginationEmailSettings}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>

		<div class="card w-full">
			<div class="card-header flex items-center justify-between h-14 py-0">
				<Lead>{$t('settings:app:blacklists:meta:usernames:label')}</Lead>
				<button
					class="btn variant-outline-secondary hover:variant-ghost-secondary min-w-24 h-8 flex items-center gap-0 p-2"
					on:click|stopPropagation={handle_modal_ban_username}
				>
					<PlusIcon class="w-4 h-4" />
					<Small class="font-semibold">
						{$t('settings:app:blacklists:username:add')}
					</Small>
				</button>
			</div>
			<div class="card-body flex flex-col px-4">
				<Paragraph>{$t('settings:app:blacklists:username:description')}</Paragraph>
			</div>
			<div class="card-body flex flex-col p-[1px] rounded-none">
				<Table
					text="rounded-none variant-glass"
					class="rounded-none"
					regionHead="variant-glass"
					source={tableUsername}
					interactive={true}
					on:selected={handle_select_username}
				/>
			</div>
			<div class="card-footer flex flex-col p-2 mt-auto">
				<Paginator
					on:page={handle_change_page_username}
					class="ms-auto"
					bind:settings={paginationUsernameSettings}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
		<div class="card w-full">
			<div class="card-header flex items-center justify-between h-14 py-0">
				<Lead>{$t('settings:app:whitelists:meta:emails:label')}</Lead>
				<button
					class="btn variant-outline-secondary hover:variant-ghost-secondary min-w-24 h-8 flex items-center gap-0 p-2"
					on:click|stopPropagation={handle_modal_add_email}
				>
					<PlusIcon class="w-4 h-4" />
					<Small class="font-semibold">
						{$t('settings:app:whitelists:email:add')}
					</Small>
				</button>
			</div>
			<div class="card-body flex flex-col px-4">
				<Paragraph>{$t('settings:app:whitelists:email:description')}</Paragraph>
			</div>
			<div class="card-body flex flex-col p-[1px] rounded-none">
				<Table
					text="rounded-none variant-glass"
					class="rounded-none"
					regionHead="variant-glass"
					source={tableWhiteEmail}
					interactive={true}
					on:selected={handle_select_email_white}
				/>
			</div>
			<div class="card-footer flex flex-col p-2 mt-auto">
				<Paginator
					on:page={handle_change_page_white_email}
					class="ms-auto"
					bind:settings={paginationWhiteEmailSettings}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
	</div>
</div>
