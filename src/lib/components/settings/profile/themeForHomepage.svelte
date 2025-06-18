<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as Select from '$lib/components/ui/select';
	import { getTranslations } from '$lib/i18n/index.svelte';

	let { theme } = $props();
	const i18n = getTranslations();
</script>

<form
	id="changeTheme"
	method="post"
	use:enhance={({ formData }) => {
		formData.set('theme', theme);
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (theme !== 'system' && theme === 'dark') document.documentElement.classList.add('dark');
			if (theme !== 'system' && theme !== 'dark') document.documentElement.classList.remove('dark');
			if (theme === 'system') {
				if (window.matchMedia('(prefers-color-scheme: dark)').matches)
					document.documentElement.classList.add('dark');
				else document.documentElement.classList.remove('dark');
			}
		};
	}}
	action="?/theme"
	class="flex flex-col gap-2"
>
	<Select.Root 
		type="single"
		bind:value={theme}
		onOpenChange={(open) => {
			if (!open && theme !== page.data.theme)
				document.forms.namedItem('changeTheme')?.requestSubmit();
		}}
	>
		<Select.Trigger class="w-full font-semibold bg-transparent"  showArrow={false}>
			<i class="ph-duotone text-[20px] {page.data.theme === 'dark' && 'ph-moon'} {page.data.theme ==='light' && 'ph-sun'} {page.data.theme && 'ph-devices'}"></i>
		</Select.Trigger>
		<Select.Content>
			{#each ['dark', 'light', 'system'] as th}
				<Select.Item value={th}>
					{i18n.t(`settings.label.theme-${th}`)}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</form>
