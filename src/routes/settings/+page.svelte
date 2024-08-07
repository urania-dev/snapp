<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Icon from '$lib/ui/icon.svelte';
	import type { User } from 'lucia';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { invalidateAll } from '$app/navigation';
	import { toast } from '$lib/svelte-sonner';
	import { fly } from 'svelte/transition';
	import UserProfile from './user_profile.svelte';
	import UserToken from './user_token.svelte';
	import AdminPanel from './admin_panel.svelte';
	import SmtpPanel from './smtp_panel.svelte';
	import ApiLimits from './api_limits.svelte';
	import Watchlists from './watchlists.svelte';
	import Card from '$lib/ui/card.svelte';
	import { env } from '$env/dynamic/public';
	import Migration from './migration.svelte';

	let { data, form } = $props();

	let active_field = $state<keyof User | string>();

	let edit_field_value = $state<string>();
	let edit_field_table = $state<string>();

	function save_this(field: keyof User | string, value: string, table = 'user') {
		active_field = field;
		edit_field_table = table;
		edit_field_value = value;
		document.forms.namedItem('save-field')?.requestSubmit();
	}
	const enhanceSaveField: SubmitFunction = ({ formData, cancel }) => {
		if (!active_field || !edit_field_table || !edit_field_value) return cancel();
		formData.set('key', active_field);
		formData.set('value', edit_field_value);
		formData.set('table', edit_field_table);

		return async function ({ result }) {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form?.message));
			setTimeout(() => {
				active_field = undefined;
				edit_field_table = undefined;
				edit_field_value = undefined;
			}, 250);
		};
	};
</script>

<svelte:head>
	<title>{$_('appname')} | {$_('menu.settings')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
<form
	action="?/update-field"
	id="save-field"
	use:enhance={enhanceSaveField}
	method="post"
	hidden
></form>

<div class="flex h-max w-full flex-col p-4 pb-8">
	<div class="mx-auto flex h-max w-full max-w-5xl flex-col gap-4">
		<h2 class="flex items-center gap-2 text-2xl font-bold">
			<Icon ph="gear" style="duotone" size={36} />
			{$_('menu.settings')}
		</h2>

		<UserProfile
			is_admin={data.is_admin}
			bind:username={data.user.username}
			bind:email={data.user.email}
			bind:role={data.user.role}
			bind:active_field
			bind:lang={data.lang}
			bind:theme={data.theme}
			{save_this}
		></UserProfile>

		<UserToken bind:token={data.token} bind:lang={data.lang} code={data.code}></UserToken>

		{#if data.is_admin === true}
			<AdminPanel
				bind:enable_limits={data.enable_limits}
				bind:disable_home={data.disable_home}
				bind:enabled_signup={data.enabled_signup}
				bind:allow_http={data.allow_http}
				{save_this}
			/>
			<Migration></Migration>
			<SmtpPanel
				bind:smtp_from={data.smtp_from}
				bind:smtp_host={data.smtp_host}
				bind:smtp_pass={data.smtp_pass}
				bind:smtp_port={data.smtp_port}
				bind:smtp_user={data.smtp_user}
				bind:smtp_status={data.smtp_status}
				{save_this}
			></SmtpPanel>
			{#if data.enable_limits}
				<div class="flex w-full" transition:fly={{ y: 25 }}>
					<ApiLimits bind:rpd={data.rpd} bind:rpm={data.rpm} bind:spu={data.spu} {save_this} />
				</div>
			{/if}

			<Watchlists
				_limit={data.limit}
				_offset={data.offset}
				bind:blacklist_count={data.blacklist_count}
				bind:whitelist_count={data.whitelist_count}
				bind:whitelist_count_domains={data.whitelist_count_domains}
				bind:whitelist_count_usernames={data.whitelist_count_usernames}
				bind:whitelist_count_emails={data.whitelist_count_emails}
				bind:whitelist_domains={data.whitelist_domains}
				bind:whitelist_usernames={data.whitelist_usernames}
				bind:whitelist_emails={data.whitelist_emails}
				bind:blacklist_domains={data.blacklist_domains}
				bind:blacklist_usernames={data.blacklist_usernames}
				bind:blacklist_emails={data.blacklist_emails}
				bind:blacklist_count_domains={data.blacklist_count_domains}
				bind:blacklist_count_usernames={data.blacklist_count_usernames}
				bind:blacklist_count_emails={data.blacklist_count_emails}
				bind:vtapistatus={data.vtapistatus}
				bind:vtapikey={data.vtapikey}
				{save_this}
			/>
		{/if}

		<Card css={{ card: 'flex-row gap-4' }}>
			<Card css={{ card: 'flex-row gap-6' }}>
				<a
					href="https://github.com/urania-dev/snapp"
					target="_blank"
					class="group flex items-center gap-2"
				>
					<Icon ph="github-logo"></Icon>
					<small class="pt-0.5 transition-all group-hover:text-pink-500">Github</small>
				</a>
				<a
					href="https://hub.docker.com/r/uraniadev/snapp"
					target="_blank"
					class=" group flex items-center gap-2"
				>
					<Icon ph="shipping-container"></Icon>
					<small class="pt-0.5 transition-all group-hover:text-pink-600">Docker Hub</small>
				</a>
				<a
					href="https://opensource.org/license/mit"
					target="_blank"
					class="group ms-auto flex items-center gap-2"
				>
					<Icon ph="keyhole"></Icon>
					<small class="pt-0.5 transition-all group-hover:text-pink-500"
						>{new Date().getFullYear()} MIT License</small
					>
				</a>
			</Card>
			<Card css={{ card: 'flex-row max-w-max' }}>
				<small class="font-bold">
					version: {env.PUBLIC_SNAPP_VERSION}
				</small>
			</Card>
		</Card>
	</div>
</div>

<style lang="postcss">
	:global(pre) {
		padding: 1rem;
		border-radius: theme('borderRadius.sm');
		line-height: theme('lineHeight.relaxed');
		margin: 0;
		width: 100%;
		height: 100%;
		transition: all 0.25s ease-in;
	}
</style>
