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
		externalVisits: number;
		internalVisits: number;
	};

	type Stat = { day: Date; visits: number };
	type Stats = {
		external: Stat[];
		internal: Stat[];
	};

	const { chartData: raw }: { chartData?: Stats } = $props();
	type Point = { day: Date; externalVisits: number; internalVisits: number };

	const byDay = $derived.by(() => {
		const byDay = new SvelteMap<string, ChartPoint>();

		for (const row of raw?.internal || []) {
			const key = new Date(row.day).toISOString().slice(0, 10);
			byDay.set(key, {
				day: new Date(row.day),
				externalVisits: 0,
				internalVisits: row.visits
			});
		}

		for (const row of raw?.external || []) {
			const key = new Date(row.day).toISOString().slice(0, 10);
			const existing = byDay.get(key);
			if (existing) {
				existing.externalVisits = row.visits;
			} else {
				byDay.set(key, {
					day: new Date(row.day),
					externalVisits: row.visits,
					internalVisits: 0
				});
			}
		}
		return byDay;
	});

	const chartData: Point[] = $derived(
		Array.from(byDay.values()).sort((a, b) => a.day.getTime() - b.day.getTime())
	);

	const chartConfig = {
		externalVisits: {
			color: 'var(--chart-2)',
			label: `${m.visits()} (${m.external()})`
		},
		internalVisits: { color: 'var(--chart-1)', label: `${m.visits()}` }
	} satisfies Chart.ChartConfig;
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{m.visits()}</Card.Title>
		<Card.Description>{m.visits_helper_period()}</Card.Description>
	</Card.Header>
	<Card.Content>
		<svelte:boundary>
			{#snippet pending()}
				<div class="h-[25vh] w-full flex flex-col">
					<LoaderIcon class="m-auto animate-spin" />
				</div>
			{/snippet}
			<Chart.Container config={chartConfig} class="h-[25vh] w-full">
				<AreaChart
					data={chartData}
					x="day"
					xScale={scaleUtc()}
					yPadding={[25, 25]}
					series={[
						{
							color: chartConfig.internalVisits.color,
							key: 'internalVisits',
							label: chartConfig.internalVisits.label
						},
						{
							color: chartConfig.externalVisits.color,
							key: 'externalVisits',
							label: chartConfig.externalVisits.label
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
