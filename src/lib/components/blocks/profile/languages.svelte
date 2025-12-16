<script lang="ts">
	import type { FormEventHandler } from 'svelte/elements';

	import LanguagesIcon from '@lucide/svelte/icons/languages';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { getLocale, locales } from '$lib/paraglide/runtime';
	import { saveLanguagePreference } from '$lib/remotes/preferences.remote';
	import { translateLanguage } from '$lib/utils';
	import { toast } from 'svelte-sonner';
	const ChangeLanguageProcess: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const locale = formData.get('locale')?.toString() as 'en';
		try {
			await saveLanguagePreference(locale);
			toast.success(m.preferences_saved());
		} catch (error) {
			console.error('[profile] set language FE', error);
			toast.error(m.errors_generic());
		}
	};
	let language = $state<(typeof locales)[0]>();
</script>

<form class="contents" onsubmit={ChangeLanguageProcess}>
	<Field.Field>
		<Field.Label for="locale">{m.language()}</Field.Label>
		<InputGroup.Root class="w-full md:max-w-sm">
			<InputGroup.Addon>
				<LanguagesIcon />
			</InputGroup.Addon>
			<Select.Root type="single" bind:value={language}>
				<Select.Trigger class="grow border-r-0" id="locale">
					{translateLanguage(getLocale(), getLocale())}
				</Select.Trigger>
				<Select.Content>
					{#each locales as locale (locale)}
						<Select.Item label={translateLanguage(getLocale(), locale)} value={locale} />
					{/each}
				</Select.Content>
			</Select.Root>
		</InputGroup.Root>
	</Field.Field>
</form>
