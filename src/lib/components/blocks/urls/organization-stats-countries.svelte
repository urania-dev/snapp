<script lang="ts">
	import type { CountryVisit } from '$lib/server/metrics/helpers';

	import LoaderIcon from '@lucide/svelte/icons/loader';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { m } from '$lib/paraglide/messages';
	import { scaleBand } from 'd3-scale';
	import { BarChart } from 'layerchart';
	import { cubicInOut } from 'svelte/easing';

	const { metrics = [] }: { metrics: CountryVisit[] } = $props();

	type Agg = { country: string; visitors: number };

	const NORD = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
		'var(--chart-6)',
		'var(--chart-7)',
		'var(--chart-8)',
		'var(--chart-9)',
		'var(--chart-10)'
	];

	function nordColor(index: number): string {
		const base = NORD[index % NORD.length];
		return `oklch(from ${base} l c h / 70%)`;
	}

	const aggregatedRaw = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const map = new Map<string, number>();

		for (const row of metrics) {
			const rawName = row.country?.trim() || m.other();
			const key = rawName.toLowerCase() === 'other' ? m.other() : rawName;

			const visits = (row.internal ?? 0) + (row.external ?? 0);
			map.set(key, (map.get(key) ?? 0) + visits);
		}

		return [...map.entries()].map(([country, visitors]) => ({
			country,
			visitors
		})) satisfies Agg[];
	});

	const aggregated = $derived.by(() => {
		const sorted = aggregatedRaw.slice().sort((a, b) => b.visitors - a.visitors);

		const otherIndex = sorted.findIndex(
			(x) => x.country.toLowerCase() === 'other' || x.country === m.other()
		);

		if (otherIndex !== -1) {
			sorted.splice(otherIndex, 1);
		}

		if (sorted.length > 5) sorted.length = 5;

		return sorted;
	});

	const chartConfig = $derived.by(() => {
		const cfg: Chart.ChartConfig = {};

		aggregated.forEach((row, i) => {
			cfg[row.country] = {
				color: nordColor(i),
				label: row.country
			};
		});

		cfg.visitors = { label: m.visits() };
		return cfg;
	});

	type Stat = { color: string; country: string; visitors: number };

	const chartData = $derived.by(
		() =>
			aggregated.map((row, i) => ({
				color: nordColor(i),
				country: row.country,
				visitors: row.visitors
			})) satisfies Stat[]
	);
</script>

<Card.Root class="h-full w-full">
	<Card.Header>
		<Card.Title>{m.metrics_countries()}</Card.Title>
		<Card.Description>{m.metrics_from_helper()}</Card.Description>
	</Card.Header>
	<Card.Content class="h-full w-full">
		<svelte:boundary>
			{#snippet pending()}
				<div class="h-full w-full flex flex-col">
					<LoaderIcon class="m-auto animate-spin" />
				</div>
			{/snippet}
			<Chart.Container config={chartConfig} class="h-62! aspect-auto">
				<BarChart
					labels={{ offset: 12 }}
					data={chartData}
					orientation="horizontal"
					yScale={scaleBand().padding(0.25)}
					y="country"
					axis="y"
					c="color"
					cRange={chartData.map((c) => c.color)}
					x="visitors"
					rule={false}
					padding={{ left: 100, right: 40 }}
					props={{
						bars: {
							initialWidth: 0,
							initialX: 0,
							motion: {
								width: { duration: 500, easing: cubicInOut, type: 'tween' },
								x: { duration: 500, easing: cubicInOut, type: 'tween' }
							},
							radius: 5,
							rounded: 'all',
							stroke: 'none'
						},
						highlight: { area: { fill: 'none' } },
						yAxis: {
							tickLabelProps: {
								class: 'stroke-none',
								dx: -100,
								textAnchor: 'start'
							},
							tickLength: 0
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip />
					{/snippet}
				</BarChart>
			</Chart.Container>
		</svelte:boundary>
	</Card.Content>
</Card.Root>
