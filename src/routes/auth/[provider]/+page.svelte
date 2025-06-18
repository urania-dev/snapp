<script>
	import H3 from '$lib/components/typography/heading/h3.svelte';
	import P from '$lib/components/typography/text/p.svelte';
	import * as Card from '$lib/components/ui/card';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { fade } from 'svelte/transition';

	const i18n = getTranslations();
    const {data} = $props()
</script>

<div class="m-auto w-max p-4" in:fade|global>
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<div class="flex items-center gap-3">
				<i class="ph-duotone ph-link-simple text-[32px]"></i><H3>{i18n.t('appname')}</H3>
			</div>
		</Card.Header>
		<Card.Content class="px-8">
            {#if data?.error?.startsWith('errors.')}
				<P>{@html i18n.t(data.error, {provider:data.provider})}</P>
                {:else}
				<P>{data?.error}</P>
                {/if}
		</Card.Content>
	</Card.Root>
</div>
