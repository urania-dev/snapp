<script lang="ts">
	import type { BrowserVisit } from '$lib/server/metrics/helpers';

	import CircleIcon from '@lucide/svelte/icons/circle';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Chart from '$lib/components/ui/chart/index.js';
	import { Label } from '$lib/components/ui/label';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { Arc, PieChart, Text } from 'layerchart';

	const { metrics = [] }: { metrics: BrowserVisit[] } = $props();

	type Agg = { browser: string; visitors: number };

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
			const rawName = row.browser?.trim() || m.other();
			const key = rawName.toLowerCase() === 'other' ? m.other() : rawName;

			const visits = (row.internal ?? 0) + (row.external ?? 0);
			map.set(key, (map.get(key) ?? 0) + visits);
		}

		return [...map.entries()].map(([browser, visitors]) => ({
			browser,
			visitors
		})) satisfies Agg[];
	});

	const aggregated = $derived.by(() => {
		const sorted = aggregatedRaw.slice().sort((a, b) => b.visitors - a.visitors);

		const otherIndex = sorted.findIndex(
			(x) => x.browser.toLowerCase() === 'other' || x.browser === m.other()
		);

		let otherTotal = 0;
		if (otherIndex !== -1) {
			otherTotal += sorted[otherIndex].visitors;
			sorted.splice(otherIndex, 1);
		}

		if (sorted.length > 9) {
			const rest = sorted.slice(9);
			otherTotal += rest.reduce((acc, r) => acc + r.visitors, 0);
			sorted.length = 9;
		}

		if (otherTotal > 0) {
			sorted.push({ browser: m.other(), visitors: otherTotal });
		}

		return sorted;
	});

	const chartConfig = $derived.by(() => {
		const cfg: Chart.ChartConfig = {};

		aggregated.forEach((row, i) => {
			cfg[row.browser] = {
				color: nordColor(i),
				label: row.browser
			};
		});

		cfg.visitors = { label: m.visits() };
		return cfg;
	});

	type PieDatum = { browser: string; color: string; visitors: number };

	const chartData = $derived.by(
		() =>
			aggregated.map((row, i) => ({
				browser: row.browser,
				color: nordColor(i),
				visitors: row.visitors
			})) satisfies PieDatum[]
	);

	let hovered = $state<number>();

	let total = $derived(aggregated.reduce((a, b) => a + b.visitors, 0));
</script>

<Card.Root class="flex flex-col h-full">
	<Card.Header class="items-center">
		<Card.Title>{m.metrics_browsers()}</Card.Title>
		<Card.Description>{m.metrics_browsers_helper()}</Card.Description>
	</Card.Header>

	<Card.Content class="flex-1 flex flex-col h-full">
		<svelte:boundary>
			{#snippet pending()}
				<div class="h-full w-full flex flex-col">
					<LoaderIcon class="m-auto animate-spin" />
				</div>
			{/snippet}
			<div class="flex flex-col @2xl:flex-row w-full justify-center h-full items-center">
				<Chart.Container config={chartConfig} class="w-full min-w-xs max-h-[25vh] aspect-square">
					<PieChart
						data={chartData}
						key="browser"
						value="visitors"
						c="color"
						innerRadius={60}
						padding={20}
						label={(d) => d?.browser?.charAt(0)?.toUpperCase() + d.browser?.slice(1)}
						props={{ arc: { motion: 'spring' }, pie: { motion: 'tween' } }}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}

						{#snippet arc({ index, props })}
							{@const arcProps =
								index === hovered
									? {
											...props,
											innerRadius: 60,
											outerRadius: 110
										}
									: props}
							<Arc {...arcProps} onclick={() => (hovered = index)} />
						{/snippet}
						{#snippet aboveMarks()}
							<Text
								value={String(
									hovered
										? chartData[hovered].visitors.toLocaleString(getLocale(), {
												compactDisplay: 'short',
												notation: 'compact'
											})
										: total.toLocaleString(getLocale(), {
												compactDisplay: 'short',
												notation: 'compact'
											})
								)}
								textAnchor="middle"
								verticalAnchor="middle"
								class="fill-foreground text-3xl! font-bold"
								dy={3}
							/>
							<Text
								value={m.visits()}
								textAnchor="middle"
								verticalAnchor="middle"
								class="fill-muted-foreground! text-muted-foreground"
								dy={22}
							/>
						{/snippet}
					</PieChart>
				</Chart.Container>
				<div
					class="grid @5xl/donut:flex grid-cols-2 @4xl/donut:grid-cols-3 w-full @5xl/donut:w-max gap-x-4 content-center auto-rows-auto flex-col min-w-max @5xl:pe-8 justify-center gap-1 max-w-sm h-full"
				>
					{#each chartData.sort((a, b) => b.visitors - a.visitors) as c, idx (c.browser)}
						<Button
							variant="outline"
							onclick={() => (hovered !== idx ? (hovered = idx) : (hovered = undefined))}
							class={[
								'p-2 justify-start rounded h-max flex gap-2 items-center',
								hovered !== idx ? 'border-transparent! shadow-none bg-transparent! ' : ''
							]}
						>
							<CircleIcon class="size-3! fill-current/20" style="color: {c?.color}" />
							<Label class="leading-0 justify-between w-full flex items-center"
								><span>{c.browser}</span><span
									class={[
										'animate-in duration-100 fade-in',
										hovered === idx ? 'opacity-100' : 'opacity-0'
									]}>{c.visitors}</span
								></Label
							>
						</Button>
					{/each}
				</div>
			</div>
		</svelte:boundary>
	</Card.Content>
</Card.Root>
