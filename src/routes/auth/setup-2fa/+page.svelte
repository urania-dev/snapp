<script lang="ts">
	import Link2Icon from '@lucide/svelte/icons/link-2';
	import FetchTotp from '$lib/components/blocks/profile/fetch-totp.svelte';
	import QrCodeTotp from '$lib/components/blocks/profile/qr-code-totp.svelte';
	import TotpVerification from '$lib/components/blocks/profile/totp-verification.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { m } from '$lib/paraglide/messages';
	let open = $state(false);
	let showOTPTest = $state(false);
	let totpURI = $state<string>();
	let backupCodes = $state<string[]>([]);
	const {data}=$props()
</script>

<div class="p-4 m-auto">
	<Card.Root class="mx-auto w-full max-w-lg">
		<Card.Header>
			<Card.Title>
				<div class="flex items-center gap-2">
					<Link2Icon />
					<span>{data.appname}</span>
				</div>
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="flex w-full max-w-lg flex-col gap-4">
				{#if typeof totpURI === 'undefined'}
					<FetchTotp bind:backupCodes bind:totpURI hideDialog />
				{:else if !showOTPTest}
					<QrCodeTotp bind:showOTPTest bind:backupCodes bind:totpURI />
				{:else if showOTPTest}
					<TotpVerification bind:showOTPTest bind:open />
					<Label>{m.two_factor_helper_totp()}</Label>
				{/if}
			</div>
		</Card.Content></Card.Root
	>
</div>
