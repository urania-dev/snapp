<script lang="ts">
	import type { Root } from '@amcharts/amcharts5';
	import type { Usage } from '@prisma/client';

	import { getLocalTimeZone } from '@internationalized/date';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { getMetricsStore } from '$lib/stores/metrics.svelte';
	import { mode } from 'mode-watcher';
	import { fade } from 'svelte/transition';

	import { worldLow } from './worldLow';
	const start_color = $mode !== 'dark' ? '#eaeaea' : '#120e15';
	const end_color = '#639';
	let root = $state<Root>();
	let data = $state<{ id: null | string; name?: null | string; value: number }[]>([]);
	const mstore = getMetricsStore();

	const loadData = async () => {
		if(!browser) return
		const alpha2 = (await import('iso-3166-1-alpha-2')).default;
		try {
			const res = (await (
				await (page.data.fetch as typeof fetch)(
					`/api/usage/groupBy?q=${JSON.stringify({
						_count: true,
						by: ['country'],
						where: {
							ownerId: page.data.user.role !== 'user' ? undefined : page.data.user.id,
							timestamp: {
								gte: mstore.start.toDate(getLocalTimeZone()).toISOString(),
								lte: mstore.end.toDate(getLocalTimeZone()).toISOString()
							}
						}
					})}`
				)
			).json()) as { data: ({ _count: number } & Usage)[] };
			if (res && res?.data)
				data = res.data.map((item) => ({
					id: item.country ? alpha2.getCode(item.country) : null,
					name: item.country,
					value: item._count
				}));
			await initMap();
		} catch (error) {
			console.log(error);
		}
	};

	const initMap = async () => {
		if (!browser||!container) return;

		const am5 = await import('@amcharts/amcharts5');
		const am5Map = await import('@amcharts/amcharts5/map');

		if (root === undefined) root = am5.Root.new(container);

		let chart = root.container.children.push(
			am5Map.MapChart.new(root, {
				projection: am5Map.geoNaturalEarth1()
			})
		);

		chart.chartContainer.set(
			'background',
			am5.Rectangle.new(root, {
				fill: am5.color($mode !== 'dark' ? '#ffffff' : '#0a0a0a'),
				fillOpacity: 1
			})
		);
		let polygonSeries = chart.series.push(
			am5Map.MapPolygonSeries.new(root, {
				calculateAggregates: true,
				geoJSON: worldLow,
				stroke: am5.color($mode !== 'dark' ? '#eaeaea' : '#120e15'),
				valueField: 'value'
			})
		);

		polygonSeries.mapPolygons.template.setAll({
			tooltipText: '{name}: {value}'
		});
		polygonSeries.set('heatRules', [
			{
				dataField: 'value',
				key: 'fill',
				max: am5.color(end_color),
				min: am5.color(start_color),
				target: polygonSeries.mapPolygons.template
			}
		]);
		const ids = worldLow.features.map(({ id, properties }) => {
			return {
				id,
				name: properties?.name,
				value: data.find((i) => i.id === id)?.value || 0
			};
		});
		polygonSeries.data.setAll(ids);
	};
	$effect(() => {
		return () => {
			root?.dispose?.();
			root = undefined;
		};
	});

	let container = $state<HTMLElement>();
</script>

<div class="h-full min-h-[264px] w-full p-2" in:fade|global>
	<div class="flex h-full w-full shrink-0 flex-col rounded border p-4">
		<div bind:this={container} class="h-full w-full"></div>
		{#await loadData()}
			<div class="flex h-full min-h-[264px] w-full items-center justify-center">
				<div class="h-max w-max animate-spin duration-1000">
					<i class="ph ph-spinner text-[50px]"></i>
				</div>
			</div>
		{/await}
	</div>
</div>
