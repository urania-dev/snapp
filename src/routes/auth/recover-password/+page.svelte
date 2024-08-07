<script lang="ts">
	import { _ } from 'svelte-i18n';
	import logo from '$lib/utils/logo.svg?raw';
	import Input from '$lib/ui/input.svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from '$lib/svelte-sonner';
	import Icon from '$lib/ui/icon.svelte';
	import Card from '$lib/ui/card.svelte';

	let { form } = $props();

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

	const enhanceRecover: SubmitFunction = () => {
		return async function ({ result }) {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.error($_(form?.message));
			else goto('/dashboard');
		};
	};
</script>

<svelte:head>
	<title>{$_('appname')} | {$_('users.auth.recover-password')}</title>
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
		<p class="w-full text-balance text-sm">{$_('users.auth.helpers.forgot-password')}</p>
		<form class="flex w-full flex-col gap-4" method="post" use:enhance={enhanceRecover}>
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
				/>
			</Card>
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
			<button
				type="submit"
				class="flex h-10 w-full items-center rounded border-none bg-slate-500/25 p-2 px-4 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
			>
				<span>{$_('users.auth.recover-password')}</span>
				<Icon css={{ icon: 'ms-auto' }} ph="arrow-right"></Icon>
			</button>
		</form>
	</Card>
</div>
