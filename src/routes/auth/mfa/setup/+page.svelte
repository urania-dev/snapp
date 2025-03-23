<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import OtpForm from '$lib/components/auth/otpForm.svelte';
	import H3 from '$lib/components/typography/heading/h3.svelte';
	import P from '$lib/components/typography/text/p.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { fade } from 'svelte/transition';

	const { data } = $props();
	const i18n = getTranslations();

	const TOTPKEY_IS_SET = $derived(page?.form?.set === true || false);
</script>

<div
	class="m-auto w-full max-w-md shrink-0 p-4 {TOTPKEY_IS_SET ? '' : 'lg:max-w-2xl'}"
	in:fade|global
>
	<Card.Root class="w-full max-w-md transition-all {TOTPKEY_IS_SET ? '' : 'lg:max-w-2xl'}">
		<Card.Header>
			<div class="flex items-center gap-3">
				<i class="ph-duotone ph-link-simple text-[32px]"></i>
				<H3>
					{i18n.t('appname')}
				</H3>
			</div>
		</Card.Header>
		<Card.Content class="px-8">
			{#if !TOTPKEY_IS_SET}
				<P>{i18n.t('users.auth.helpers.set-new-authenticator')}</P>
				<div class="flex h-full w-full shrink-0 flex-col gap-4 lg:flex-row">
					<Card.Root class="mt-4 w-full overflow-clip">
						{@html data.qrcode}
					</Card.Root>
					<div class="flex w-full flex-wrap content-start gap-4 pt-4 lg:grid">
						<form class="contents" action="?/setTOTPKEY" method="post" use:enhance>
							<Button type="submit" class="w-full">
								{i18n.t('globals.continue')}
							</Button>
						</form>
						<Button
							variant="outline"
							class="inline-flex w-full max-w-[calc(50%_-_.5rem)] lg:max-w-full"
							onclick={() => {
								const blob = new Blob([data.qrcode], { type: 'image/svg+xml' });
								const link = document.createElement('a');
								link.href = URL.createObjectURL(blob);
								link.download = 'totp.svg';
								link.click();
							}}
						>
							<i class="ph-duotone ph-qr-code text-[20px]"></i>
							{i18n.t('globals.download')}
						</Button>
						<Button
							variant="outline"
							class="inline-flex w-full max-w-[calc(50%_-_.5rem)] lg:max-w-full"
							onclick={() => {
								const blob = new Blob([data.keyURI], { type: 'text/plain' });
								const link = document.createElement('a');
								link.href = URL.createObjectURL(blob);
								link.download = 'totp.txt';
								link.click();
							}}
						>
							<i class="ph-duotone ph-file-txt text-[20px]"></i>
							{i18n.t('globals.download')}
						</Button>

						<P class="my-2 w-full text-sm">{i18n.t('users.auth.helpers.only-once-mfa')}</P>
					</div>
				</div>
			{:else}
				<OtpForm otpForm={data.form} />
			{/if}
		</Card.Content>
		<Card.Footer class="m-0 grid leading-[1]">
			<P class="text-center text-sm">
				<a class="link" href="https://freeotp.github.io/">RedHat's FreeOTP Authenticator</a>
			</P>
			<P class="!m-0 !mt-2 text-center text-sm">
				<a
					class="link"
					href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2"
					>Google Autenticator</a
				>
			</P>
		</Card.Footer>
	</Card.Root>
</div>
