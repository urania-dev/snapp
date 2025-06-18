<script>
	import H3 from '$lib/components/typography/heading/h3.svelte';
	import P from '$lib/components/typography/text/p.svelte';
	import * as Card from '$lib/components/ui/card';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { decode } from 'html-entities';

	const i18n = getTranslations();
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class="flex h-full w-full items-center justify-between px-4">
		<Card.Root class="m-auto max-w-sm">
			<Card.Header class="flex flex-row items-center justify-start gap-2">
				<i
					class="ph-duotone ph-link-break mx-auto aspect-square max-w-max rounded bg-foreground/20 p-2 text-[32px]"
				></i>
				<H3 class="m-0 w-full text-balance p-0 text-start">{i18n.t('errors.snapps.not-found')}</H3>
			</Card.Header>
			<Card.Content class="px-3">
				<P class="text-semibold m-0 text-balance p-0 px-4 text-start text-sm"
					>{decode(i18n.t('errors.snapps.disabled'))}</P
				>
			</Card.Content>
		</Card.Root>
	</div>
</div>
