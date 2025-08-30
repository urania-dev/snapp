<script>
	import OtpForm from "$lib/components/auth/otpForm.svelte";
	import H3 from "$lib/components/typography/heading/h3.svelte";
	import P from "$lib/components/typography/text/p.svelte";
	import * as Card from "$lib/components/ui/card";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { fade } from "svelte/transition";

	const { data } = $props();
	const i18n = getTranslations();
</script>

<div class="m-auto w-full max-w-md shrink-0 p-4" in:fade|global>
	<Card.Root class="w-full max-w-md transition-all">
		<Card.Header>
			<div class="flex items-center gap-3">
				<i class="ph-duotone ph-link-simple text-[32px]"></i><H3>{i18n.t("appname")}</H3>
			</div>
		</Card.Header>
		<Card.Content class="px-8">
			<OtpForm otpForm={data.form} />
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
