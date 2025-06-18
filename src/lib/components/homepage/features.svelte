<script lang="ts">
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { getTranslations } from '$lib/i18n/index.svelte';

	import H2 from '../typography/heading/h2.svelte';
	import H3 from '../typography/heading/h3.svelte';
	import Large from '../typography/text/large.svelte';
	import P from '../typography/text/p.svelte';
	import CardDecorator from './card-decorator.svelte';

	const i18n = getTranslations();

	const { features }: { features: { icon: string; label: string; text: string }[] } = $props();
</script>

<div class="@container mx-auto max-w-5xl px-6">
	<div class="text-center">
		<H2 class="text-balance text-4xl font-semibold lg:text-5xl">
			{i18n.t('homepage.features.why.labels.why')}
		</H2>
		<Large class="mt-4 text-muted-foreground">
			{i18n.t('homepage.features.why.helpers.why')}
		</Large>
	</div>
	<div
		class="md:max-w-full md:grid-cols-3 mx-auto mt-8 grid max-w-sm gap-6 *:text-center md:mt-16 justify-center"
	>
		{#each features as feature}
			<Card class="p-0 group shadow-zinc-950/5 max-w-xs">
				<CardHeader>
					<CardDecorator>
						<i class="ph-duotone ph-{feature.icon} text-[24px]"></i>
					</CardDecorator>
					<H3 class="mt-6 font-medium">{i18n.t(feature.label)}</H3>
				</CardHeader>

				<CardContent>
					<P class="text-muted-foreground font-medium px-3">
						{i18n.t(feature.text)}
					</P>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
