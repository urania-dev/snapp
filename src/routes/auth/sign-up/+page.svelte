<script lang="ts">
	import { _ } from 'svelte-i18n';
	import logo from '$lib/utils/logo.svg?raw';
	import Input from '$lib/ui/input.svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types.js';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Icon from '$lib/ui/icon.svelte';
	import Card from '$lib/ui/card.svelte';
	import { slugify } from '$lib/utils/slug.js';

	let { form, data } = $props();
	let show_password = $state(false);
	let show_confirm_password = $state(false);

	const handle_password: MouseEventHandler<HTMLButtonElement> = (e) => {
		e?.preventDefault();
		show_password = !show_password;
	};
	const handle_confirm_password: MouseEventHandler<HTMLButtonElement> = (e) => {
		e?.preventDefault();
		show_confirm_password = !show_confirm_password;
	};

	const enhanceSignUp: SubmitFunction = () => {
		return async function ({ result }) {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.error($_(form?.message));
		};
	};
</script>

<svelte:head>
	<title>{$_('appname')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
<div class="m-auto flex w-full max-w-sm flex-col gap-4 rounded">
	<Card css={{ card: 'w-full' }}>
		<h2 class="flex w-full items-center justify-start gap-2 text-2xl font-bold">
			<span class="h-8 w-8">
				{@html logo}
			</span>
			<span>
				{$_('appname')}
			</span>
		</h2>
		{#if data.enabled_signup}
			<form class="flex w-full flex-col gap-4" method="post" use:enhance={enhanceSignUp}>
				<Card css={{ card: 'w-full' }}>
					<Input
						name="username"
						actions={{
							input: (e) => {
								e.currentTarget.value = slugify(e.currentTarget.value);
							}
						}}
						label={$_('users.fields.username')}
						icons={{ left: 'user' }}
						placeholder={$_('users.placeholders.username')}
					/>
				</Card>
				<Card css={{ card: 'w-full' }}>
					<Input
						name="email"
						label={$_('users.fields.email')}
						icons={{ left: 'envelope' }}
						placeholder={$_('users.placeholders.email')}
					/>
				</Card>
				<Card css={{ card: 'w-full' }}>
					<Input
						name="password"
						placeholder={$_('users.placeholders.password')}
						type={show_password === true ? 'text' : 'password'}
						label={$_('users.fields.password')}
						icons={{ left: 'key', right: show_password === true ? 'eye' : 'eye-closed' }}
						actions={{
							right: handle_password
						}}
					/></Card
				>
				<Card css={{ card: 'w-full' }}>
					<Input
						name="confirm-password"
						placeholder={$_('users.placeholders.password')}
						type={show_confirm_password === true ? 'text' : 'password'}
						label={$_('users.fields.confirm-password')}
						icons={{ left: 'key', right: show_confirm_password === true ? 'eye' : 'eye-closed' }}
						actions={{
							right: handle_confirm_password
						}}
					/>
				</Card>

				<small>{$_('users.helpers.password')} </small>
				<Card css={{ card: 'p-0 bg-transparent border-transparent border-0' }}>
					<button
						type="submit"
						class="flex h-10 w-full items-center justify-between gap-2 rounded bg-slate-500/25 px-4 hover:bg-slate-500/50 focus:bg-slate-500/50"
					>
						<span>{$_('users.auth.sign-up')}</span>
						<Icon css={{ icon: 'ms-auto' }} ph="arrow-right"></Icon>
					</button>
				</Card>
			</form>
		{:else}
			<Card css={{ card: 'w-full' }}>
				<p>{$_('errors.auth.disabled-signups')}</p>
			</Card>
		{/if}
		<p class="w-full text-balance px-4 text-sm">
			{@html $_('users.auth.go-to-signin', { values: { url: '/auth/sign-in' } })}
		</p>
	</Card>
</div>
