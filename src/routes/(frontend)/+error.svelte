<script>
	import { page } from '$app/stores';
	import { getLocale } from '$lib/i18n';
	import { H3, Paragraph } from '$lib/ui/typography';
	import XOctagonIcon from 'lucide-svelte/icons/x-octagon';
	const { t } = getLocale();

</script>
<svelte:head><title>{$t('global:appname')} | {$t('global:pages:error:page:title',{status:$page.status})}</title></svelte:head>

<div class="container max-w-md flex flex-col mx-auto items-center justify-center h-full p-4">
	<div class="card p-4 variant-ghost-primary">
		<div class="card-header flex gap-2 items-center">
			<XOctagonIcon strokeWidth="1.5" class="w-5 h-5" />
			<H3 class="pb-0.5">{$t('error:page:title', { status: $page.status })}</H3>
		</div>
		<div class="card-body p-4">
			<Paragraph class="leading-6">{$t($page.error?.message ?? 'error:page:unknown')}</Paragraph>
		</div>
	</div>
</div>
