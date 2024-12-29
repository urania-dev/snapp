<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import logo from '$lib/utils/logo.svg?raw';
	import { _ } from 'svelte-i18n';
	import type { SubmitFunction } from './$types.js';
	import { toast } from 'svelte-sonner';
	import { cn } from '$lib/utils/cn.js';
	import Input from '$lib/ui/input.svelte';

	let { data, form } = $props();

	let TOTPKEY_IS_SET = $derived(form?.set === true || false);

	const enhanceSubmission: SubmitFunction = () => {
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form && form?.message && form.message?.trim() !== '')
				toast.info($_(form.message, { values: { TIME: form?.remaining_time } }));
			if (form?.success) await goto('/dashboard');
		};
	};

	let otp = $state<string>();
</script>

<svelte:head>
	<title>{$_('appname')} | {$_('users.auth.recover-password')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>

{#if !TOTPKEY_IS_SET}
	<div class="m-auto flex w-full flex-col gap-4 self-center justify-self-center">
		<Card css={{ card: 'flex flex-col max-w-sm mx-auto' }}>
			<h2 class="flex w-full items-center justify-start gap-2 text-2xl font-bold">
				<span class="h-8 w-8">
					{@html logo}
				</span>
				{$_('appname')}
			</h2>
			<p class="w-full text-balance my-2 text-sm">
				{$_('users.auth.helpers.set-new-authenticator')}
			</p>
			<div class="flex gap-4 flex-col w-full">
				<Card css={{ card: 'p-2' }}>
					<div class="w-full h-full aspect-square max-w-sm">
						{@html data.qrcode}
					</div>
				</Card>
			</div>
			<div class="flex w-full gap-2">
				<button
					onclick={() => {
						const blob = new Blob([data.qrcode], { type: 'image/svg+xml' });
						const link = document.createElement('a');
						link.href = URL.createObjectURL(blob);
						link.download = 'QRCODE_TOTP.svg';
						link.click();
					}}
					class="flex h-10 w-full gap-2 items-center rounded border-none justify-center bg-slate-500/25 p-2 px-4 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
				>
					<Icon ph="qr-code" />
					<span>
						{$_('globals.download')}
					</span>
				</button>

				<button
					onclick={() => {
						const blob = new Blob([data.keyURI], { type: 'text/plain' });
						const link = document.createElement('a');
						link.href = URL.createObjectURL(blob);
						link.download = 'TOTP.txt';
						link.click();
					}}
					class="flex h-10 w-full gap-2 items-center rounded border-none justify-center bg-slate-500/25 p-2 px-4 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
				>
					<Icon ph="file-txt" />
					<span>
						{$_('globals.download')}
					</span></button
				>
			</div>
			<form class="contents" action="?/setTOTPKEY" method="post" use:enhance>
				<button
					class="flex h-10 w-full gap-2 items-center rounded border-none justify-center bg-slate-500/25 p-2 px-4 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
				>
					<span>
						{$_('globals.continue')}
					</span>
					<Icon ph="arrow-right" />
				</button>
			</form>

			<p class="w-full my-2 text-sm">{$_('users.auth.helpers.only-once-mfa')}</p>
		</Card>
		<div class="text-sm text-center flex flex-col gap-4">
			<a class="link" href="https://freeotp.github.io/">RedHat's FreeOTP Authenticator</a>
			<a
				class="link"
				href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
				>Google Autenticator</a
			>
		</div>
	</div>
{:else}
	<div class={cn('flex h-full w-full flex-col p-4 pb-8')}>
		<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
			<div class="flex h-full w-full items-center justify-center gap-4">
				<Card css={{ card: 'items-center m-auto max-w-md gap-4 p-4 leading-relaxed text-balance' }}>
					<a class="contents" href="/">
						<h2 class="flex w-full items-center gap-2 text-2xl font-bold">
							<span class="h-8 w-8">
								{@html logo}
							</span>
							<span>
								{$_('appname')}
							</span>
						</h2>
					</a>
					<p class="text-sm w-full">{$_('users.auth.insert-otp')}</p>
					<form
						method="post"
						id="send-otp"
						action="?/test"
						class="contents"
						use:enhance={enhanceSubmission}
					>
						<Input
							css={{
								group: 'h-20 max-w-max items-center',
								input: 'w-full max-h-auto text-center leading-none items-center'
							}}
							icons={{ left: 'device-mobile', sizeLeft: 38 }}
							label={$_('users.auth.otp')}
							placeholder={'* * * * * *'}
							bind:value={otp}
							actions={{
								input: (e) => {
									otp = e.currentTarget.value.replace(/[^0-9]/g, '');
									if (otp.length === 6) document.forms.namedItem('send-otp')?.requestSubmit();
								}
							}}
							name="otp"
							type="text"
						/>
						<button
							class="flex h-10 w-full gap-2 items-center rounded border-none justify-between bg-slate-500/25 p-2 px-4 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
							type="submit"
						>
							<span>{$_('globals.confirm')}</span>
							<Icon ph="arrow-right" />
						</button>
					</form>
				</Card>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(#otp) {
		font-size: 3rem !important;
	}
	:global(#otp:placeholder) {
		font-size: 3rem !important;
	}
</style>
