<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import * as Field from '$lib/components/ui/field';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { m } from '$lib/paraglide/messages';

	import Dialog from '../commons/dialog.svelte';
	import DisableTotp from './disable-totp.svelte';
	import FetchTotp from './fetch-totp.svelte';
	import QrCodeTotp from './qr-code-totp.svelte';
	import TotpVerification from './totp-verification.svelte';
	const { user }: { user: User } = $props();
	let open = $state(false);
	let areYouSure = $state(false);
	let checked = $derived(user?.twoFactorEnabled === true || false);
	let showOTPTest = $state(false);
	let totpURI = $state<string>();
	let backupCodes = $state<string[]>([]);
</script>

<Field.Set class="w-full">
	<Field.Label for="2fa">
		<Field.Field orientation="horizontal">
			<Field.Content>
				<span>{m.two_factor_label()}</span>
				<Field.Description class="max-w-xl @xl:text-xs text-balance">
					{m.two_factor_helper()}
				</Field.Description>
			</Field.Content>
			<Switch
				name="2fa"
				id="2fa"
				onCheckedChange={(check) => {
					if (check) open = true;
					else areYouSure = true;
				}}
				bind:checked
			/>
		</Field.Field>
	</Field.Label>
</Field.Set>
<Dialog
	description=""
	bind:open
	title={m.two_factor_label()}
	onOpenChange={(o) => {
		if (!o) {
			setTimeout(async () => {
				await invalidateAll();
				totpURI = undefined;
				showOTPTest = false;
			}, 250);
		}
	}}
	><div class="flex w-full max-w-lg flex-col gap-4">
		{#if typeof totpURI === 'undefined'}
			<FetchTotp bind:backupCodes bind:totpURI />
		{:else if !showOTPTest}
			<QrCodeTotp bind:showOTPTest bind:backupCodes bind:totpURI />
		{:else if showOTPTest}
			<TotpVerification bind:showOTPTest bind:open />
			<Label>{m.two_factor_helper_totp()}</Label>
		{/if}
	</div>
</Dialog>
<DisableTotp bind:open={areYouSure} bind:checked {user} />
