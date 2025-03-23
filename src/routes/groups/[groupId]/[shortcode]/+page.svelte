<script>
	import { SingleForm } from '$lib/components/snapps';
	import * as Card from '$lib/components/ui/card';
	import { getTranslations } from '$lib/i18n/index.svelte';

	let { data } = $props();

	const i18n = getTranslations();
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class="flex h-full w-full items-center justify-between px-4">
		<Card.Root class="m-auto max-w-sm">
			<Card.Header class="flex flex-row items-center gap-2">
				<i
					class="ph-duotone ph-detective mx-auto aspect-square max-w-max rounded bg-foreground/20 p-2 text-[32px]"
				></i>
				{#if data.isDisabled === true}
					<p class="text-semibold m-0 text-balance p-0 px-4 text-start">
						{i18n.t('snapps.helpers.not-found')}
					</p>
				{:else if data.hasPassword}
					<p class="text-semibold m-0 text-balance p-0 px-4 text-start">
						{i18n.t('snapps.helpers.secret')}
					</p>
				{/if}
			</Card.Header>
			<Card.Content class="px-3">
				{#if data.form}
					<SingleForm formSchema={data.form} />
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
