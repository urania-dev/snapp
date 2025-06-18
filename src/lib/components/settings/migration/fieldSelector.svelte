<script lang="ts">
	import type { SvelteMap } from 'svelte/reactivity';

	import P from '$lib/components/typography/text/p.svelte';
	import * as Card from '$lib/components/ui/card';
	import Label from '$lib/components/ui/label/label.svelte';
	import { getTranslations } from '$lib/i18n/index.svelte';

	import Snappfields from './snappfields.svelte';

	let {
		snappStructure = $bindable(),
		structuredFields = $bindable(),
	}: {
		snappStructure: {
			createdAt: string | undefined;
			disabled: string | undefined;
			expiresAt: string | undefined;
			groupId: string | undefined;
			hit: string | undefined;
			maxUsages: string | undefined;
			notes: string | undefined;
			originalUrl: string | undefined;
			secret: string | undefined;
			shortcode: string | undefined;
			utmParams: string | undefined;
		};
		structuredFields: SvelteMap<string, Set<string>>;
	} = $props();

	const i18n = getTranslations();

	let showTable = $state('0');
</script>

<div class="my-4 grid gap-2">
	{#each structuredFields as [i]}
		{#if showTable === i}
			<Card.Root>
				<Card.Content class="grid w-full gap-1">
					<Label>{i18n.t('migrations.set-fields.label')}</Label>
					<P class="!mt-2 text-sm text-muted-foreground">{i18n.t('migrations.set-fields.helper')}</P
					>
					<Snappfields bind:snapp={snappStructure} fields={structuredFields.get(i) || new Set()} />
				</Card.Content>
			</Card.Root>
		{/if}
	{/each}
</div>
