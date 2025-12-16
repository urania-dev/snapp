<script lang="ts">
	import type { FormEventHandler } from 'svelte/elements';

	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import * as InputOTP from '$lib/components/ui/input-otp/index';
	import { m } from '$lib/paraglide/messages';
	import { getHost } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	import * as v from 'valibot';
	type TwoFactorFormProps = {
		open?: boolean;
		showOTPTest: boolean;
	};
	let { open = $bindable(), showOTPTest = $bindable() }: TwoFactorFormProps = $props();
	const fetch = $derived(page.data.fetch);
	const verifyTwoFactor: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		const valid = v.safeParse(v.pipe(v.string(), v.nonEmpty(m.errors_non_empty())), inputOTP);
		if (!valid.success) {
			toast.error(m.errors_non_empty());
			return;
		}
		const host = await getHost();
		try {
			const authClient = getAuthClient(host.origin, fetch);
			const res = await authClient.twoFactor.verifyTotp({
				code: valid.output,
				trustDevice: true
			});
			if (res.error) toast.error(m.errors_totp_invalid());
			if (res.data) {
				if (page.url.pathname.startsWith('/auth')) await goto(resolve('/dashboard'));
				open = false;
				setTimeout(() => {
					showOTPTest = false;
				}, 250);
			}
		} catch (error) {
			console.error('[profile] set totp', error);
			toast.error(m.errors_saving_profile());
		}
	};
	let inputOTP = $state<string>('');
	$effect(() => {
		if (inputOTP?.length === 6) document.forms.namedItem('verify-2fa')?.requestSubmit();
	});
</script>

<form onsubmit={verifyTwoFactor} class="grid w-full max-w-max grid-cols-1 gap-4" id="verify-2fa">
	<InputOTP.Root class="gap-4 md:gap-3" maxlength={6} bind:value={inputOTP} autofocus>
		{#snippet children({ cells })}
			<InputOTP.Group>
				{#each cells.slice(0, 3) as cell, idx (idx)}
					<InputOTP.Slot {cell} />
				{/each}
			</InputOTP.Group>
			<InputOTP.Separator />
			<InputOTP.Group>
				{#each cells.slice(3, 6) as cell, idx (idx)}
					<InputOTP.Slot {cell} />
				{/each}
			</InputOTP.Group>
		{/snippet}
	</InputOTP.Root>
</form>
