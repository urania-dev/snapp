<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import logo from '$lib/utils/logo.svg?raw';
	import { _ } from 'svelte-i18n';

	let { data } = $props();
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
		<p class="w-full text-balance my-2 text-sm">{$_('users.auth.helpers.set-new-authenticator')}</p>
		<div class="flex gap-4 flex-col w-full">
			<Card css={{ card: 'p-2' }}>
				<div class="w-full h-full aspect-square">
					{@html data.qrcode}
				</div>
			</Card>
		</div>
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
