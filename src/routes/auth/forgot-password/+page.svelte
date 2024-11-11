<script lang="ts">
	import { _ } from 'svelte-i18n';
	import logo from '$lib/utils/logo.svg?raw';
	import Input from '$lib/ui/input.svelte';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types.js';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Icon from '$lib/ui/icon.svelte';
	import Card from '$lib/ui/card.svelte';

	let sent = $state(false);

	let { form } = $props();
	const enhanceRecover: SubmitFunction = () => {
		return async function ({ result }) {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.error($_(form?.message));
			if (form?.sent) toast.info($_('users.auth.reset-email-sent'));
			sent = form?.sent || false;
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
<div class="m-auto flex w-full max-w-sm flex-col gap-4 self-center justify-self-center">
	<Card>
		<h2 class=" flex w-full items-center justify-start gap-2 text-2xl font-bold">
			<span class="h-8 w-8">
				{@html logo}
			</span>
			{$_('appname')}
		</h2>
		{#if sent === false}
			<p class="w-full text-balance text-sm">{$_('users.auth.helpers.forgot-password')}</p>
			<form class="flex flex-col gap-4" method="post" use:enhance={enhanceRecover}>
				<Card>
					<Input
						name="email"
						label={$_('users.fields.email')}
						icons={{ left: 'envelope' }}
						placeholder={$_('users.placeholders.email')}
					/>
				</Card>
				<button
					type="submit"
					class="flex h-10 w-full items-center rounded border-none bg-slate-500/25 p-2 px-4 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
				>
					<span>{$_('users.auth.recover-password')}</span>
					<Icon css={{ icon: 'ms-auto' }} ph="arrow-right"></Icon>
				</button>
				<p class="text-balance px-4 text-sm">
					{@html $_('users.auth.go-to-signup', { values: { url: '/auth/sign-up' } })}
				</p>
			</form>
		{:else}
			<p>{$_('users.auth.post-email-message')}</p>
		{/if}
	</Card>
</div>
