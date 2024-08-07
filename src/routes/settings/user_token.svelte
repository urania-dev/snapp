<script lang="ts">
	import { enhance } from '$app/forms';
	import { _ } from 'svelte-i18n';
	import { toast } from '$lib/svelte-sonner';
	import { page } from '$app/stores';
	import Card from '$lib/ui/card.svelte';
	import Input from '$lib/ui/input.svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import type { Token } from '@prisma/client';
	import { browser } from '$app/environment';
	import Icon from '$lib/ui/icon.svelte';

	let {
		token = $bindable(),
		lang = $bindable(),
		code
	}: { code: string; token: (Token & { jwt: string | undefined }) | null; lang: string } = $props();

	let show_apikey = $state(false);

	let handle_show_apikey: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.preventDefault();
		show_apikey = !show_apikey;
	};

	const handle_copy_to_clipboard: MouseEventHandler<HTMLButtonElement> = async (e) => {
		e.preventDefault();
		if (!token || !token.jwt) {
			toast.error($_('tokens.not-found'));
			return;
		}
		if (!browser || !token || !navigator.clipboard || $page.url.protocol !== 'https:') {
			toast.error($_('tokens.not-allowed-to-copy'));
			return;
		}

		await navigator.clipboard.writeText(token.jwt);
		toast.info($_('tokens.copied'));
	};
</script>

<Card css={{ card: 'gap-4' }}>
	<Card css={{ card: 'flex-row justify-between py-2' }}>
		<h4 class="text-lg font-semibold">{@html $_('tokens.label')}</h4>
	</Card>

	<div class="flex w-full flex-col gap-4 lg:flex-row">
		<form
			class="inline-flex w-full flex-col gap-4"
			id="handle-token"
			action="?/handle-token"
			method="post"
			use:enhance
		>
			<Card>
				<div class="flex w-full gap-3">
					<Input
						name="key"
						disabled
						type={show_apikey === true ? 'text' : 'password'}
						placeholder={$_('tokens.placeholder')}
						icons={{ left: 'command', right: show_apikey === true ? 'eye' : 'eye-closed' }}
						actions={{ right: handle_show_apikey }}
						label={$_('tokens.fields.key')}
						value={token?.jwt}
					/>
					<button
						onclick={handle_copy_to_clipboard}
						class="mt-auto flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-500/25 transition-all hover:bg-slate-500/50"
					>
						<Icon ph="copy"></Icon>
					</button>
				</div>
				{#if token}
					<small class="w-full px-1 font-semibold"
						>{@html $_('tokens.fields.created')}
						{new Date(token.created).toLocaleDateString(lang, {
							dateStyle: 'medium'
						})}</small
					>
				{/if}
			</Card>

			<Card css={{ card: 'h-full' }}>
				<small class="text-balance leading-relaxed">{@html $_('tokens.helper')}</small>
			</Card>
			<Card css={{ card: 'h-10 bg-transparent border-transparent border-0 p-0' }}>
				{#if token === null}
					<button
						class="flex h-10 w-full shrink-0 items-center justify-between rounded bg-slate-500/50 px-4 text-sm hover:bg-slate-500/75 focus:bg-slate-500/75"
					>
						<span>
							{$_('tokens.generate')}
						</span><Icon ph="sparkle"></Icon>
					</button>
				{:else}
					<button
						class="flex h-10 w-full shrink-0 items-center justify-between rounded bg-pink-700/50 px-4 text-sm transition-all hover:bg-pink-700/75 focus:bg-pink-700/75"
					>
						<span>
							{$_('tokens.revoke')}
						</span><Icon ph="trash"></Icon>
					</button>
				{/if}
			</Card>
		</form>
		<div class="inline-flex w-full flex-col gap-4">
			<Card css={{ card: 'p-4 h-full' }}>{@html code}</Card>
			<Card>
				<small class="w-full text-balance leading-relaxed">
					{@html $_('tokens.api-docs', { values: { url: '/docs' } })}
				</small>
			</Card>
		</div>
	</div>
</Card>
