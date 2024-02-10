<script lang="ts">
	import { signOut } from '@auth/sveltekit/client';
	import { slugify } from '$lib/utils/slugify/index';
	import { applyAction, enhance } from '$app/forms';
	import { getLocale } from '$lib/i18n';
	import { H3, Lead, Paragraph } from '$lib/ui/typography';
	import Breadcrumbs from '$lib/ui/crumbs/breadcrumbs.svelte';
	import SettingsIcon from 'lucide-svelte/icons/settings';
	import SignOutIcon from 'lucide-svelte/icons/alert-octagon';
	import UserCircleIcon from 'lucide-svelte/icons/user-round';
	import SaveIcon from 'lucide-svelte/icons/save';
	import HeartIcon from 'lucide-svelte/icons/heart';
	import CrownIcon from 'lucide-svelte/icons/crown';
	import LanguagesIcon from 'lucide-svelte/icons/languages';
	import EmailIcon from 'lucide-svelte/icons/mail';
	import CopyIcon from 'lucide-svelte/icons/copy';
	import EyeOffIcon from 'lucide-svelte/icons/eye-off';
	import EyeIcon from 'lucide-svelte/icons/eye';
	import KeyIcon from 'lucide-svelte/icons/key-round';
	import Small from '$lib/ui/typography/small.svelte';
	import GitHubIcon from '$lib/logo/github.svg?raw';
	import DockerHubIcon from '$lib/logo/docker.svg?raw';
	import type { SubmitFunction } from './$types.js';
	import { toast } from 'svelte-sonner';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	import { invalidate, invalidateAll } from '$app/navigation';
	import { clipboard, CodeBlock, getModalStore, type ModalSettings } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';

	let { t } = getLocale();
	const modalStore = getModalStore();

	export let data, form;

	let profileRef: HTMLFormElement;
	let apiKeyRef: HTMLFormElement;

	let apikey: string | undefined = data.user.apikey ?? undefined;
	let username: string = data.user.username;
	let email: string | undefined = data.user?.email;
	let password: string | undefined;
	let show_password = false;
	let profile_is_saving = false;

	let { lang, user } = data;
	$: ({ apikey } = user);

	function handle_submit_enter(e: KeyboardEvent) {
		const keyEvent = e as KeyboardEvent;
		if (keyEvent.code !== 'Enter' && keyEvent.code !== 'NumpadEnter') return;

		document.forms.namedItem('profile')?.requestSubmit();
	}

	function handle_slugify(this: HTMLInputElement) {
		username = slugify(this.value).replace('-', '_');
	}

	function handle_show_password() {
		show_password = !show_password;
	}

	let profile_has_been_edited = false;

	$: profile_has_been_edited =
		username !== data.user.username ||
		email !== data.user.email ||
		(password !== undefined && password.trim() !== '');

	function handle_generate_token() {
		document.forms.namedItem('apikey')?.requestSubmit();
	}

	function handle_revoke_token() {
		const modal: ModalSettings = {
			type: 'confirm',
			buttonTextConfirm: $t('global:misc:confirm'),
			buttonTextCancel: $t('global:misc:cancel'),
			// Data
			title: $t('apikey:revoke'),
			body: $t('apikey:revoke:message'),
			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (confirmed: boolean) => {
				if (confirmed === true) document.forms.namedItem('apikey')?.requestSubmit();
			}
		};
		modalStore.trigger(modal);
	}

	let show_api_key = false;

	async function handle_show_api_key(e: MouseEvent) {
		e.preventDefault();
		show_api_key = !show_api_key;
	}
	async function handle_copy_api_key(e: MouseEvent) {
		if ($page.url.origin.startsWith('https')) {
			toast.custom(CustomToast, {
				componentProps: { message: 'snapp:clipboard:copied', state: 'surface' }
			});
		} else {
			toast.custom(CustomToast, {
				componentProps: { message: 'snapp:clipboard:error', state: 'error' }
			});
		}
	}

	const handle_edit_profile: SubmitFunction = function () {
		profile_is_saving = true;

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
			await invalidate('snapp:settings');
			reset_form();
			profile_is_saving = false;
		};
	};

	function handle_select_language() {
		const form = document.forms.namedItem('change-language');
		form?.requestSubmit();
	}

	const handle_language: SubmitFunction = function ({ formData }) {
		profile_is_saving = true;
		formData.set('lang', lang);
		return async function ({ result }) {
			await applyAction(result);
			if (result.status === 200)
				toast.custom(CustomToast, {
					componentProps: {
						message: 'auth:profile:saved'
					}
				});
			else if (form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'error'
					}
				});

			await invalidateAll();
			profile_is_saving = false;
		};
	};

	const enhance_key_submit: SubmitFunction = function ({ formData }) {
		if (apikey) formData.set('apikey', apikey);
		return async function ({ result }) {
			await applyAction(result);
			if (form?.newKeyId) {
				apikey = form.newKeyId;
				toast.custom(CustomToast, {
					componentProps: {
						state: 'success',
						message: 'apikey:token:generated'
					}
				});
			} else {
				apikey = undefined;
				toast.custom(CustomToast, {
					componentProps: {
						message: 'apikey:token:revoked'
					}
				});
			}
		};
	};

	function reset_form() {
		username = data.user.username;
		email = data.user.email;
		password = undefined;
	}

	async function handle_sign_out() {
		await signOut();
	}

	let fetch_token_string = `
const request = await fetch(\`api/\${endpoint}\`, {
	"headers" : {
		"Authorization": "Bearer {token}" 
	}
})
`;
</script>

<svelte:head><title>{$t('global:appname')} | {$t('global:pages:settings')}</title></svelte:head>

<form id="change-language" action="?/lang" method="post" use:enhance={handle_language} />
<div class="page max-w-5xl">
	<Breadcrumbs
		urls={[
			{ label: $t('global:pages:dashboard'), href: '/dashboard' },
			{ label: $t('global:pages:settings') }
		]}
	/>
	<div class="flex gap-2 items-center">
		<SettingsIcon class="w-6 h-6" />
		<H3 class="mb-1 w-max">
			{$t('global:pages:settings')}
		</H3>
		<button class="btn variant-ghost-error ms-auto flex items-center" on:click={handle_sign_out}>
			<SignOutIcon class="w-4 h-4" />
			<Small class="font-bold p-0.5">{$t('auth:sign:out')}</Small>
		</button>
	</div>
	<form
		id="profile"
		action="?/saveProfile"
		method="post"
		bind:this={profileRef}
		use:enhance={handle_edit_profile}
		class="card w-full"
	>
		<div class="card-header flex items-center justify-between h-14 py-0">
			<Lead>{$t('global:sections:profile')}</Lead>
			{#if profile_has_been_edited}
				<div class="flex gap-2">
					{#if !profile_is_saving}
						<button
							class="btn variant-outline-secondary hover:variant-ghost-secondary justify-center ring-surface-300-600-token h-8 p-0 px-2 flex flex-shrink-0"
							on:click|preventDefault={reset_form}
						>
							<Paragraph class="font-semibold tracking-wide">{$t('global:misc:revert')}</Paragraph>
						</button>
					{/if}
					<button
						class="btn {profile_is_saving
							? 'variant-filled-tertiary animate-pulse'
							: 'variant-outline-secondary hover:variant-ghost-secondary'} justify-center ring-surface-300-600-token h-8 p-0 px-2 flex flex-shrink-0"
					>
						{#if !profile_is_saving}
							<Paragraph class="font-semibold tracking-wide">{$t('global:misc:save')}</Paragraph>
						{/if}
						<SaveIcon class="w-4 h-4" strokeWidth="2" />
					</button>
				</div>
			{/if}
		</div>
		<div class="card-body pb-4 px-4 grid lg:grid-cols-2 gap-4">
			<label for="username" class="flex flex-col gap-2 mb-2">
				<Paragraph class="font-semibold ps-2">{$t('auth:username')}</Paragraph>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<UserCircleIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					<input
						class="input rounded-none"
						class:input-error={form?.username}
						on:keydown={handle_submit_enter}
						on:input={handle_slugify}
						id="username"
						type="text"
						name="username"
						autocomplete="off"
						aria-autocomplete="none"
						placeholder={$t('auth:username:placeholder')}
						bind:value={username}
					/>
				</div>
			</label>
			<label for="email" class="flex flex-col gap-2">
				<Paragraph class="font-semibold ps-2">{$t('auth:email')}</Paragraph>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<EmailIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					<input
						class="input rounded-none"
						class:input-error={form?.email}
						id="email"
						type="text"
						autocomplete="off"
						aria-autocomplete="none"
						on:keydown={handle_submit_enter}
						name="email"
						placeholder={$t('auth:email:placeholder')}
						bind:value={email}
					/>
				</div>
			</label>

			<label for="password" class="flex flex-col gap-2 mb-2">
				<Paragraph class="font-semibold ps-2">{$t('auth:password')}</Paragraph>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<KeyIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					{#if show_password === false}
						<input
							class="input rounded-none"
							class:input-error={form?.password}
							id="password"
							type="password"
							autocomplete="off"
							aria-autocomplete="none"
							name="password"
							on:keydown={handle_submit_enter}
							placeholder={$t('auth:password:placeholder')}
							bind:value={password}
						/>
					{:else}
						<input
							class="input rounded-none"
							class:input-error={form?.password}
							id="password"
							autocomplete="off"
							aria-autocomplete="none"
							type="text"
							name="password"
							on:keydown={handle_submit_enter}
							placeholder={$t('auth:password:placeholder')}
							bind:value={password}
						/>
					{/if}
					<div class="w-10 h-10 flex" style:padding="0">
						<button
							tabindex="-1"
							class="w-10 h-10"
							style:justify-content="center"
							style:padding="0"
							on:click|preventDefault={handle_show_password}
						>
							{#if show_password === false}
								<EyeIcon strokeWidth="1.5" class="w-5 h-5" />
							{:else}
								<EyeOffIcon strokeWidth="1.5" class="w-5 h-5" />
							{/if}
						</button>
					</div>
				</div>

				<Small class="mt-1">
					{$t('auth:password:guidelines')}
					{$t('auth:password:change')}
				</Small>
			</label>
			<label for="localization" class="flex flex-col gap-2">
				<Paragraph class="font-semibold ps-2">{$t('settings:lang')}</Paragraph>
				<div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
					<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
						<LanguagesIcon strokeWidth="1.5" class="w-5 h-5" />
					</div>
					<select
						id="localization"
						class="select"
						autocomplete="off"
						aria-autocomplete="none"
						disabled={data.locales.length === 1}
						bind:value={lang}
						on:change={handle_select_language}
					>
						{#each data.languages as { label, code }}
							<option selected value={code}>{label}</option>
						{/each}
					</select>
				</div>
				<Small class="mt-1">
					{@html $t('settings:lang:contribute', { url: 'https://github.com/urania-dev/snapp' })}
				</Small>
			</label>
		</div>
		{#if data.settings.isSuperAdmin || data.settings.isAdmin}
			<div class="card-footer py-3 flex items-center gap-2">
				{#if data.settings.isSuperAdmin}
					<span
						class="badge cursor-default h-6 variant-glass-secondary me-2 inline-flex items-center"
					>
						<CrownIcon class="w-3.5 h-3.5" />
						<Small class="font-bold uppercase text-[.625rem]">Super Admin</Small>
					</span>
				{:else if data.settings.isAdmin}
					<span class="badge cursor-default h-6 variant-glass-warning">
						<Small class="font-bold uppercase text-[.625rem]">Admin</Small>
					</span>
				{/if}
			</div>
		{/if}
	</form>
	<div class="card w-full">
		<div class="card-header flex items-center justify-between h-14 py-0">
			<Lead>{$t('global:sections:apikey')}</Lead>
		</div>
		<div class="card-body pb-4 px-4 grid lg:grid-cols-2 gap-4">
			<form
				id="apikey"
				action="?/apiKeys"
				method="post"
				bind:this={apiKeyRef}
				use:enhance={enhance_key_submit}
			>
				<div class="flex flex-col">
					<label for="apikey" class="flex flex-col gap-2 mb-2">
						<Paragraph class="font-semibold ps-2">{$t('apikey:token')}</Paragraph>
						<div class="input-group input-group-divider grid-cols-[auto_1fr_auto_auto]">
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<KeyIcon strokeWidth="1.5" class="w-5 h-5" />
							</div>
							{#if show_api_key}
								<input
									class="input rounded-none"
									on:input={handle_slugify}
									id="apikey"
									disabled
									type="text"
									name="apikey"
									autocomplete="off"
									aria-autocomplete="none"
									style="cursor:pointer !important"
									placeholder={$t('apikey:placeholder')}
									bind:value={apikey}
								/>
							{:else}
								<input
									class="input rounded-none"
									on:input={handle_slugify}
									id="apikey"
									disabled
									autocomplete="off"
									aria-autocomplete="none"
									type="password"
									name="apikey"
									style="cursor:pointer !important"
									placeholder={$t('apikey:placeholder')}
									bind:value={apikey}
								/>
							{/if}
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<button
									class="w-10 h-10 flex"
									style:justify-content="center"
									style:padding="0"
									on:click|preventDefault={handle_show_api_key}
								>
									{#if show_api_key === true}
										<EyeOffIcon strokeWidth="1.5" class="w-5 h-5" />
									{:else}
										<EyeIcon strokeWidth="1.5" class="w-5 h-5" />
									{/if}
								</button>
							</div>
							<div class="flex items-center w-10" style:padding="0" style:justify-content="center">
								<button
									class="w-10 h-10 flex"
									style:justify-content="center"
									style:padding="0"
									on:click|preventDefault={handle_copy_api_key}
									use:clipboard={apikey ?? $t('apikey:missing')}
								>
									<CopyIcon strokeWidth="1.5" class="w-5 h-5" />
								</button>
							</div>
						</div>
					</label>
					<Paragraph>{$t('apikey:description')}</Paragraph>
					<Paragraph>{@html $t('apikey:redirect:documentation', { url: '/dashboard/docs' })}</Paragraph>
				</div>
			</form>
			<div class="flex flex-col">
				<Paragraph class="font-semibold mb-1 ps-2">{$t('global:misc:example')}</Paragraph>
				<CodeBlock
					buttonLabel={$t('global:misc:copy')}
					language="javascript"
					code={fetch_token_string}
				></CodeBlock>
			</div>
		</div>
		<div class="card-footer py-4 flex items-center justify-between">
			{#if data.user.apikey_created}
				<span class="badge cursor-default variant-glass-secondary me-2">
					<Small class="font-bold uppercase text-[.625rem]"
						>{$t('apikey:created')}
						{new Date(data.user.apikey_created).toLocaleDateString(lang)}</Small
					>
				</span>
			{/if}
			{#if !apikey}
				<button class="btn variant-filled-primary h-8" on:click={handle_generate_token}>
					<Paragraph class="font-semibold">
						{$t('apikey:generate')}
					</Paragraph>
				</button>
			{:else}
				<button class="btn variant-filled-error" on:click={handle_revoke_token}>
					<Paragraph class="font-semibold">
						{$t('apikey:revoke')}
					</Paragraph>
				</button>
			{/if}
		</div>
	</div>

	<div class="card w-full overflow-clip">
		<div class="card-body p-4 w-full flex items-center gap-2">
			<a
				class="btn variant-outline-secondary hover:variant-ghost-secondary h-8 px-2"
				href="https://github.com/urania-dev/snapp"
			>
				<div class="w-4 h-4 flex items-center">
					{@html GitHubIcon}
				</div>
				<Small>Github Repository</Small>
			</a>
			<a
				class="btn variant-outline-secondary hover:variant-ghost-secondary h-8 px-2"
				href="https://hub.docker.com/r/uraniadev/snapp"
			>
				<div class="w-4 h-4 flex items-center">
					{@html DockerHubIcon}
				</div>
				<Small>Docker Image</Small>
			</a>
			{#if data.settings.isSuperAdmin || data.settings.isAdmin}
				<a
					class="btn ms-auto variant-outline-secondary hover:variant-ghost-secondary h-8 px-2"
					href="/dashboard/settings/admin"
				>
					<CrownIcon class="w-4 h-4" />
					<Small>{$t('global:pages:admin')}</Small>
				</a>
			{/if}
		</div>
		<div class="card-footer px-4 py-2 w-full flex items-center bg-secondary-800/50 text-white">
			<Small class="font-bold [font-size:0.7rem]"
				>{$t('global:appname').toUpperCase()} // v: {data.appversion}</Small
			>
			<Small class="ms-auto font-bold [font-size:0.7rem] flex items-center gap-1"
				>made with <HeartIcon class="w-3 h-3 pt-0.5" fill="currentColor" /> in urania.dev</Small
			>
		</div>
	</div>
</div>
