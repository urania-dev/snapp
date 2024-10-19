<script lang="ts">
	import { _ } from 'svelte-i18n';
	import logo from '$lib/utils/logo.svg?raw';
	import Input from '$lib/ui/input.svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types.js';
	import { invalidateAll, goto } from '$app/navigation';
	import { toast } from '$lib/svelte-sonner';
	import Icon from '$lib/ui/icon.svelte';
	import Card from '$lib/ui/card.svelte';
	import { slugify } from '$lib/utils/slug.js';

	let show_password = $state(false);

	const handle_password: MouseEventHandler<HTMLButtonElement> = (e) => {
		e?.preventDefault();
		show_password = !show_password;
	};

	let { form, data } = $props();
	const enhanceSignIn: SubmitFunction = () => {
		return async function ({ result }) {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.error($_(form?.message));
		};
	};
</script>

<svelte:head>
	<title>{$_('appname')} | {$_('menu.users')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
<div class="m-auto flex w-full max-w-sm flex-col gap-4 self-center justify-self-center">
	<Card>
		<h2 class=" flex w-full items-center justify-start gap-2 text-2xl font-bold">
			<span class="h-8 w-8">
				{@html logo}
			</span>
			{$_('appname')}
		</h2>
		<form class="flex flex-col gap-4" method="post" use:enhance={enhanceSignIn}>
			<Card>
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
			<Card>
				<Input
					name="password"
					placeholder={$_('users.placeholders.password')}
					type={show_password === true ? 'text' : 'password'}
					label={$_('users.fields.password')}
					icons={{ left: 'key', right: show_password === true ? 'eye' : 'eye-closed' }}
					actions={{
						right: handle_password
					}}
				/>
			</Card>
			<Card
				css={{
					card: 'h-10 p-0 bg-slate-500/25 hover:bg-slate-500/50 '
				}}
			>
				<a class=" flex h-full w-full items-center gap-2 p-4 text-sm" href="/auth/forgot-password">
					<Icon ph="question"></Icon>
					<span class="pt-0.5">{$_('users.auth.forgot-password')}</span>
				</a>
			</Card>
			<button
				type="submit"
				class="flex h-10 w-full items-center rounded border-none bg-slate-500/25 p-2 px-4 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
			>
				<span class="text-sm w-full">{$_('users.auth.sign-in')}</span>
				<Icon css={{ icon: 'ms-auto' }} ph="arrow-right"></Icon>
			</button>
			{#each data.oidcProviders as provider}
				<a
					data-sveltekit-preload-data="false"
					href="/auth/oauth/{provider.identity}"
					class="flex h-10 w-full items-center rounded border-none bg-slate-500/25 p-2 px-4 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
				>
					<span class="text-sm w-full">OIDC {provider.identity}</span>
					<Icon css={{ icon: 'ms-auto' }} ph="arrow-right"></Icon>
				</a>
			{/each}
			<a
				data-sveltekit-preload-data="false"
				href="/auth/oauth/"
				class="flex h-10 w-full items-center rounded border-none bg-slate-500/25 p-2 px-4 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
			>
				<span class="text-sm w-full">OAuth 2.0 &mdash; OICD</span>
				<Icon css={{ icon: 'ms-auto' }} ph="arrow-right"></Icon>
			</a>
			<p class="text-balance px-4 text-sm">
				{@html $_('users.auth.go-to-signup', { values: { url: '/auth/sign-up' } })}
			</p>
		</form>
	</Card>
</div>
