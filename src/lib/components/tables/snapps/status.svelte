<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { getTranslations } from '$lib/i18n/index.svelte';

	const { disabled }: { disabled: boolean } = $props();
	const i18n = getTranslations();
</script>

<div class="mx-auto max-w-max">
	{#if disabled === false}
		<Badge variant="outline" class="border-green-800/50 text-green-800"
			>{i18n.t('globals.active')}</Badge
		>
	{:else}
		<Badge
			class="cursor-not-allowed bg-destructive text-destructive-foreground hover:bg-destructive"
			>{i18n.t('globals.disabled')}</Badge
		>
	{/if}
</div>
