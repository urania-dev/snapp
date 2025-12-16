<script lang="ts">
	import type { FormEventHandler } from 'svelte/elements';

	import { Button } from '$lib/components/ui/button';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import * as Field from '$lib/components/ui/field';
	import { m } from '$lib/paraglide/messages';
	import { getPreferences, saveThemePreference } from '$lib/remotes/preferences.remote';
	import { setMode, userPrefersMode } from 'mode-watcher';
	import { toast } from 'svelte-sonner';
	const updatePreferences: FormEventHandler<HTMLFormElement> = async (e) => {
		e.preventDefault();
		try {
			await saveThemePreference(userPrefersMode.current).updates(getPreferences());
			toast.success(m.preferences_saved());
		} catch (error) {
			console.error('[profile] set theme', error);
			toast.error(m.save_failed());
		}
	};
</script>

<form id="theme" class="contents" onsubmit={updatePreferences}>
	<Field.Set>
		<Field.Field>
			<Field.Label>{m.dark_mode()}</Field.Label>
			<ButtonGroup>
				<Button
					class="max-w-max"
					onclick={() => {
						setMode('dark');
						document.forms.namedItem('theme')?.requestSubmit();
					}}
					variant={(userPrefersMode.current === 'dark' && 'default') || 'outline'}
					>{m.dark()}</Button
				>
				<Button
					class="max-w-max"
					onclick={() => {
						setMode('light');
						document.forms.namedItem('theme')?.requestSubmit();
					}}
					variant={(userPrefersMode.current === 'light' && 'default') || 'outline'}
					>{m.light()}</Button
				>
				<Button
					class="max-w-max"
					onclick={() => {
						setMode('system');
						document.forms.namedItem('theme')?.requestSubmit();
					}}
					variant={(userPrefersMode.current === 'system' && 'default') || 'outline'}
					>{m.system()}</Button
				>
			</ButtonGroup>
		</Field.Field>
	</Field.Set>
</form>
