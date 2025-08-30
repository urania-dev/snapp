<script>
	import { enhance } from "$app/forms";
	import H3 from "$lib/components/typography/heading/h3.svelte";
	import P from "$lib/components/typography/text/p.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Card from "$lib/components/ui/card";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { decode } from "html-entities";
	import { toast } from "svelte-sonner";
	import { fade } from "svelte/transition";

	const { data } = $props();
	const i18n = getTranslations();

	let sent = $state(false);

	$effect(() => {
		if (data.message) toast.info(decode(i18n.t(data.message)));
	});
</script>

<div class="m-auto w-full max-w-md shrink-0 p-4" in:fade|global>
	<Card.Root class="w-full max-w-md transition-all">
		<Card.Header>
			<div class="flex items-center gap-3">
				<i class="ph-duotone ph-link-simple text-[32px]"></i><H3>{i18n.t("appname")}</H3>
			</div>
		</Card.Header>
		<Card.Content class="px-8">
			<P>{i18n.t("users.auth.helpers.verify-email")}</P>
		</Card.Content>
		<Card.Footer>
			{#if !sent}
				<form
					method="post"
					action="?/resend-email"
					use:enhance={() => {
						return async ({ update }) => {
							await update({ invalidateAll: true });
							sent = true;
						};
					}}
				>
					<Button type="submit" class="flex items-center gap-2"
						><i class="ph-duotone ph-envelope text-[24px]"></i><span
							>{i18n.t("users.auth.resend-verify-email")}</span
						></Button
					>
				</form>
			{:else}
				<P>{i18n.t("users.auth.post-email-message")}</P>
			{/if}
		</Card.Footer>
	</Card.Root>
</div>
