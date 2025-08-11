<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { translateLanguage } from '$lib/utils';

	let {
		availableLanguages,
		class: classes = '',
		language
	}: {
		availableLanguages: string;
		class?: string;
		language: string;
	} = $props();

	const i18n = getTranslations();
</script>

<form
	id="changeLanguage"
	method="post"
	use:enhance={({ formData }) => {
		formData.set('language', language);
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
		};
	}}
	action="?/language"
	class="my-2 flex flex-col gap-2"
>
	<Label class="px-1">{i18n.t('settings.label.language')}</Label>
	<Select.Root
		type="single"
		bind:value={language}
		onOpenChange={(open) => {
			if (!open && language !== page.data.locale)
				document.forms.namedItem('changeLanguage')?.requestSubmit();
		}}
	>
		<Select.Trigger class="w-full font-semibold capitalize {classes} ">
			{translateLanguage(page.data.locale, page.data.locale)}
		</Select.Trigger>
		<Select.Content>
			{#each availableLanguages?.split(',') || [] as lang}
				<Select.Item value={lang} class="capitalize"
					>{translateLanguage(page.data.locale, lang)}</Select.Item
				>
			{/each}
		</Select.Content>
	</Select.Root>
</form>
