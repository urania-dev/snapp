<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import { cn } from '$lib/utils/cn';
	import { _ } from 'svelte-i18n';
	import logo from '$lib/utils/logo.svg?raw';
	import Input from '$lib/ui/input.svelte';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types.js';
	import { goto, invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	let { form } = $props();

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
	<title>{$_('appname')} | {$_('users.labels.mfa')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
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
				<form method="post" id="send-otp" class="contents" use:enhance={enhanceSubmission}>
					<Input
						css={{
							group: 'h-20 max-w-max',
							input: 'w-full max-h-auto text-center leading-none items-center'
						}}
						icons={{ left: 'device-mobile', sizeLeft: 38 }}
						label={$_('users.auth.otp')}
						placeholder={'******'}
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

<style>
	:global(#otp) {
		font-size: 3rem !important;
	}
	:global(#otp:placeholder) {
		font-size: 3rem !important;
	}
</style>
