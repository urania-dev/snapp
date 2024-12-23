<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Root } from '@amcharts/amcharts5';
	import { fade } from 'svelte/transition';

	let {
		data,
		theme
	}: {
		theme: string;
		data: { id: string | null; value: number; name?: string | null }[];
		maps?: string[];
	} = $props();
	let root = $state<Root>();
	let start_color = theme === 'dark' ? 'rgb(30, 65, 75)' : 'rgb(100, 175, 175)';
	let end_color = theme === 'dark' ? 'rgb(100, 175, 175)' : 'rgb(30, 64, 75)';

	onMount(async () => {
		if (!browser) return;
		//@ts-expect-error
		const map = globalThis?.['am5geodata_worldLow'] as any;
		if (!map) return;

		const am5 = await import('@amcharts/amcharts5');
		const am5map = await import('@amcharts/amcharts5/map');
		if (root === undefined) root = am5.Root.new('world-map');

		let chart = root.container.children.push(
			am5map.MapChart.new(root, {
				projection: am5map.geoNaturalEarth1()
			})
		);
		// Create polygon series
		let polygonSeries = chart.series.push(
			am5map.MapPolygonSeries.new(root, {
				geoJSON: map,
				valueField: 'value',
				calculateAggregates: true
			})
		);
		polygonSeries.mapPolygons.template.setAll({
			tooltipText: '{name}: {value}'
		});
		polygonSeries.set('heatRules', [
			{
				target: polygonSeries.mapPolygons.template,
				dataField: 'value',
				min: am5.color(start_color),
				max: am5.color(end_color),
				key: 'fill'
			}
		]);
		polygonSeries.mapPolygons.template.events.on('pointerover', function (ev) {
			// heatLegend.showValue(ev.target.dataItem?.get('value' as 'visible') as any);
		});
		const ids = map.features.map(({ id, properties }: any) => ({
			id,
			name: properties?.name,
			value: data.find((i) => i.id === id)?.value || 0
		}));
		polygonSeries.data.setAll(ids);
		// let heatLegend = chart.children.push(
		// 	am5.HeatLegend.new(root, {
		// 		orientation: 'vertical',
		// 		startColor: am5.color(start_color),
		// 		endColor: am5.color(end_color),
		// 		startText: '',
		// 		endText: '',
		// 		stepCount: 5
		// 	})
		// );
		// heatLegend.startLabel.setAll({
		// 	fontSize: 12,
		// 	fill: heatLegend.get('startColor')
		// });
		// heatLegend.endLabel.setAll({
		// 	fontSize: 12,
		// 	fill: heatLegend.get('endColor')
		// });
		// change this to template when possible
		polygonSeries.events.on('datavalidated', function () {
			// heatLegend.set('startValue', polygonSeries.getPrivate('valueLow'));
			// heatLegend.set('endValue', polygonSeries.getPrivate('valueHigh'));
		});
	});

	onDestroy(() => {
		root?.dispose();
		root = undefined;
	});
</script>

<div class="h-full w-full" in:fade|global>
	<div id="world-map" class="h-full w-full"></div>
</div>
