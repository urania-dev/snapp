<script lang="ts">
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { scaleUtc } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import { Area, AreaChart, LinearGradient } from 'layerchart';
	import { SvelteMap } from 'svelte/reactivity';

	type ChartPoint = {
		day: Date;
		external: number;
		internal: number;
	};

	const { chartClass = '', metrics: raw = [] }: { chartClass?: string; metrics?: ChartPoint[] } =
		$props();
	type Point = { day: Date; external: number; internal: number };

	const byDay = $derived.by(() => {
		const byDay = new SvelteMap<string, ChartPoint>();

		for (const row of raw || []) {
			const d = new Date(row.day);

			if (Number.isNaN(d.getTime())) {
				console.error('INVALID DATE ROW', row);
				continue;
			}

			const key = d.toISOString().slice(0, 10);

			byDay.set(key, {
				day: d,
				external: row.external,
				internal: row.internal
			});
		}

		return byDay;
	});

	const chartData: Point[] = $derived(
		Array.from(byDay.values()).sort((a, b) => a.day.getTime() - b.day.getTime())
	);

	const chartConfig = {
		external: {
			color: 'var(--chart-2)',
			label: `${m.visits()} (${m.external()})`
		},
		internal: { color: 'var(--chart-1)', label: `${m.visits()}` }
	} satisfies Chart.ChartConfig;
</script>

<Card.Root class="w-full @container/card h-full flex flex-col">
	<Card.Header>
		<Card.Title>{m.visits()}</Card.Title>
		<Card.Description>{m.metrics_helper_period()}</Card.Description>
	</Card.Header>
	<Card.Content class="h-full flex flex-col">
		<svelte:boundary>
			{#snippet pending()}
				<div class="h-full w-full flex grow shrink-0 flex-col">
					<LoaderIcon class="m-auto animate-spin" />
				</div>
			{/snippet}
			<Chart.Container
				config={chartConfig}
				class={['aspect-auto grow min-h-full @lg:aspect-video h-[25vh] w-full', chartClass]}
			>
				<AreaChart
					data={chartData}
					x="day"
					xScale={scaleUtc()}
					yPadding={[25, 25]}
					series={[
						{
							color: chartConfig.internal.color,
							key: 'internal',
							label: chartConfig.internal.label
						},
						{
							color: chartConfig.external.color,
							key: 'external',
							label: chartConfig.external.label
						}
					]}
					seriesLayout="stack"
					props={{
						area: {
							curve: curveNatural,
							'fill-opacity': 0.4,
							line: { class: 'stroke-1' },
							motion: 'tween'
						},
						xAxis: {
							format: (v: Date) =>
								v.toLocaleDateString(getLocale(), { day: '2-digit', month: 'short' })
						},
						yAxis: { format: () => '' }
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip
							indicator="dot"
							labelFormatter={(v: Date) => {
								return v.toLocaleDateString(getLocale(), {
									month: 'long'
								});
							}}
						/>
					{/snippet}
					{#snippet marks({ getAreaProps, series })}
						{#each series as s, i (s.key)}
							<LinearGradient
								stops={[s.color ?? '', 'color-mix(in lch, ' + s.color + ' 10%, transparent)']}
								vertical
							>
								{#snippet children({ gradient })}
									<Area {...getAreaProps(s, i)} fill={gradient} />
								{/snippet}
							</LinearGradient>
						{/each}
					{/snippet}
				</AreaChart>
			</Chart.Container>
		</svelte:boundary>
	</Card.Content>
</Card.Root>
