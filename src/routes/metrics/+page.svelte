<script lang="ts">
	import {
		BrowserDistribution,
		CityDistribution,
		CountryDistribution,
		DateSelector,
		Graph,
		OsDistribution,
		RegionDistribution,
		TopSnapps
	} from '$lib/components/metrics';
	import Map from '$lib/components/metrics/map.svelte';
	import H2 from '$lib/components/typography/heading/h2.svelte';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { setMetricsStore } from '$lib/stores/metrics.svelte';
	import SvelteSeo from "svelte-seo";

	const {data} = $props()
	const i18n = getTranslations();
	setMetricsStore();
	let view = $state<string>('topSnapps');
	let viewLabel = $state<string>();
</script>

<div class="flex w-full flex-col">
	<div class="flex w-full items-center justify-between px-4">
		<div class="flex h-20 w-full items-center gap-2">
			<i class="ph-duotone ph-presentation-chart text-[32px]"></i>
			<H2 class="m-0 p-0">{i18n.t('menu.metrics')}</H2>
		</div>
	</div>
	<Separator />
</div>
<div class="flex h-full w-full max-w-[calc(100%_-_1px)] flex-col content-start lg:flex-row overflow-y-scroll">
	<div class="flex h-full w-full flex-col">
		<DateSelector />
		<Separator />
		<div class="flex h-full flex-col py-0">
			<div class="flex h-10 w-full shrink-0 items-center justify-between px-2 py-1">
				<Label class="ps-2 text-base">
					{i18n.t('snapps.fields.hit')}
				</Label>
			</div>
			<Separator />

			<Graph />
			<Separator class="hidden lg:block" />

			<Map />
		</div>
	</div>
	<Separator orientation="vertical" class="hidden lg:block" />
	<div class="flex h-full w-full flex-col border-b py-0">
		<div class="shrink-y-0 flex w-full flex-col items-start justify-between gap-2 p-2">
			<Label class="px-2">{i18n.t('date-picker.labels.presets')}</Label>
			<Select.Root
				type="single"
				bind:value={view}
				onValueChange={(value) => {
					switch (value) {
						case 'osDistribution':
							viewLabel = i18n.t('metrics.labels.os-distribution');
							break;
						case 'topSnapps':
							viewLabel = i18n.t('metrics.labels.top-urls');
							break;
					}
				}}
			>
				<Select.Trigger>{viewLabel || i18n.t('metrics.labels.top-urls')}</Select.Trigger>
				<Select.Content>
					<Select.Item hideIcon value="topSnapps">{i18n.t('metrics.labels.top-urls')}</Select.Item>
					<Select.Item hideIcon value="osDistribution"
						>{i18n.t('metrics.labels.os-distribution')}</Select.Item
					>
					<Select.Item hideIcon value="browserDistribution"
						>{i18n.t('metrics.labels.browser-distribution')}</Select.Item
					>
					<Select.Separator />
					<Label class="p-1 py-2 pb-3 text-sm"
						>{i18n.t('metrics.labels.country-distribution')}</Label
					>
					<Select.Item hideIcon value="countryDistribution"
						>{i18n.t('metrics.fields.country')}</Select.Item
					>
					<Select.Item hideIcon value="regionDistribution"
						>{i18n.t('metrics.fields.region')}</Select.Item
					>
					<Select.Item hideIcon value="cityDistribution"
						>{i18n.t('metrics.fields.city')}</Select.Item
					>
				</Select.Content>
			</Select.Root>
		</div>
		<Separator />
		<div class="min-h-[128px]">
			{#if view === 'topSnapps'}
			<TopSnapps />
			{/if}
			
			{#if view === 'osDistribution'}
			<OsDistribution />
			{/if}
			
			{#if view === 'browserDistribution'}
			<BrowserDistribution />
			{/if}
			
			{#if view === 'countryDistribution'}
			<CountryDistribution />
			{/if}
			{#if view === 'regionDistribution'}
			<RegionDistribution />
			{/if}
			{#if view === 'cityDistribution'}
			<CityDistribution />
			{/if}
		</div>
	</div>
</div>
<SvelteSeo title={`${(data.appname||'Snapp')} | ${i18n.t('menu.settings')}`} />
