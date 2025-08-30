<script lang="ts">
	import { applyAction, enhance } from "$app/forms";
	import { invalidateAll } from "$app/navigation";
	import { page } from "$app/state";
	import * as Select from "$lib/components/ui/select";
	import { translateLanguage } from "$lib/utils";

	let {
		availableLanguages,
		class: classes = "",
		language
	}: {
		availableLanguages: string;
		class?: string;
		language: string;
	} = $props();
</script>

<form
	id="changeLanguage"
	method="post"
	use:enhance={({ formData }) => {
		formData.set("language", language);
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (language === "ar") document.dir = "rtl";
			else document.dir = "l";
		};
	}}
	action="?/language"
	class="contents"
>
	<Select.Root
		type="single"
		bind:value={language}
		onOpenChange={(open) => {
			if (!open && language !== page.data.locale)
				document.forms.namedItem("changeLanguage")?.requestSubmit();
		}}
	>
		<Select.Trigger
			showArrow={false}
			class="flex h-10 w-10 flex-col bg-transparent font-semibold capitalize {classes} "
		>
			<i class="ph-duotone ph-translate text-[24px]"></i>
		</Select.Trigger>
		<Select.Content class="m-2">
			{#each availableLanguages?.split(",") || [] as lang (lang)}
				<Select.Item value={lang} class="capitalize"
					>{translateLanguage(page.data.locale, lang)}</Select.Item
				>
			{/each}
		</Select.Content>
	</Select.Root>
</form>
