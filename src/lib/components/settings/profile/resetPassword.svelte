<script>
	import { enhance } from "$app/forms";
	import { Button } from "$lib/components/ui/button";
	import { Label } from "$lib/components/ui/label";
	import { getTranslations } from "$lib/i18n/index.svelte";

	const i18n = getTranslations();
</script>

<form method="post" use:enhance action="?/resetPassword" class="my-2 flex flex-col gap-2">
	<Label>{i18n.t("users.auth.forgot-password")}</Label>
	<Button variant="outline" type="submit" class="items-start justify-start gap-2 px-2">
		<i class="ph ph-key text-[20px]"></i><span>{i18n.t("users.auth.recover-password")}</span>
	</Button>
</form>
