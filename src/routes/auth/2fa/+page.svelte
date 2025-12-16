<script lang="ts">
	import Link2Icon from '@lucide/svelte/icons/link-2';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import OTPVerification from '$lib/components/blocks/profile/otp-verification.svelte';
	import TotpVerification from '$lib/components/blocks/profile/totp-verification.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { m } from '$lib/paraglide/messages';
	import { toast } from 'svelte-sonner';
	let sent = $state(false);
	const { data } = $props();
</script>

<div class="p-4 m-auto">
	<Card.Root class="w-full max-w-md">
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
				{#if !sent}
					<Label>{m.totp()}</Label>
					<TotpVerification showOTPTest={true} open={true} />
					<Label>{m.two_factor_helper_totp()}</Label>
				{:else}
					<Label>{m.otp()}</Label>
					<OTPVerification />
					<Label>{m.two_factor_helper_otp()}</Label>
				{/if}
			</div>
		</Card.Content>
		<Card.Footer class="flex flex-col items-start justify-between gap-2">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			<p class="@xl:text-xs leading-5 text-balance">{@html m.send_otp_mail()}</p>
			<Button
				onclick={async (e) => {
					e.preventDefault();
					try {
						const authClient = getAuthClient(data.host.origin, page.data.fetch);
						await authClient.twoFactor.sendOtp();
						sent = true;
					} catch (err) {
						console.error(err);
						toast.error(m.errors_generic());
					}
				}}
				variant="outline"
				size="sm">{m.send_mail()}</Button
			>
		</Card.Footer>
	</Card.Root>
</div>
