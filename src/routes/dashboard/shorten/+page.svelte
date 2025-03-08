<script lang="ts">
	import { CreateSnappForm } from '$lib/components/snapps';
	import H2 from '$lib/components/typography/heading/h2.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { getTranslations } from '$lib/i18n/index.svelte';

	const i18n = getTranslations();

	const { data } = $props();
</script>

<div class="flex w-full flex-col">
	<div class="flex h-20 w-full shrink-0 items-center gap-2 px-4">
		<i class="ph-duotone ph-scissors text-[32px]"></i>
		<H2 class="m-0 p-0">{i18n.t('snapps.labels.create')}</H2>
	</div>
	<Separator />
	<CreateSnappForm formSchema={data.form} />
</div>
