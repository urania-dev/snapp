<script lang="ts">
	import type { Usage } from '@prisma/client';

	import { getLocalTimeZone } from '@internationalized/date';
	import { format, PeriodType } from '@layerstack/utils';
	import { page } from '$app/state';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { getMetricsStore } from '$lib/stores/metrics.svelte';
	import { scaleBand } from 'd3-scale';
	import { Axis, Bars, Chart, LinearGradient, Svg, Tooltip } from 'layerchart';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';

	import { DateSelector } from '../metrics';
	import { Separator } from '../ui/separator';
	type CharData = { date: string; value: number };

	let { snappId }: { snappId: string } = $props();

	const i18n = getTranslations();

	const mstore = getMetricsStore();
	const loadFromDB = async () => {
		const data = [] as CharData[];
		const f = page.data.fetch as typeof fetch;
		if (!mstore.start || !mstore.end) return;
		const url = `/api/usage/findMany?q=${JSON.stringify({
			where: {
				snappId,
				timestamp: {
					gte: new Date(mstore.start.toString()).toISOString(),
					lte: new Date(
						new Date(mstore.end.toString()).getTime() + 1000 * 24 * 60 * 60
					).toISOString()
				}
			}
		})}`;

		const res = (await (await f(url)).json()) as { data: Usage[] };
		const usageMap = new Map<string, number>();

		res.data?.forEach((u) => {
			const date = new Date(u.timestamp).toLocaleDateString(page.data.locale, {
				day: 'numeric',
				month: 'numeric',
				timeZone: getLocalTimeZone()
			});

			usageMap.set(date, (usageMap.get(date) || 0) + 1);
		});

		for (
			let d = new Date(mstore.start.toDate(getLocalTimeZone()));
			d <= new Date(mstore.end.toDate(getLocalTimeZone()));
			d.setDate(d.getDate() + 1)
		) {
			const dateStr = d.toLocaleDateString(page.data.locale, {
				day: 'numeric',
				month: 'numeric',
				timeZone: getLocalTimeZone()
			});
			data.push({ date: dateStr, value: usageMap.get(dateStr) || 0 });
		}

		return data;
	};
</script>

<div
	class="grid h-max min-h-[325px] w-full flex-col"
	in:fly={{
		duration: 400,
		opacity: prefersReducedMotion.current ? 1 : 0,
		y: prefersReducedMotion.current ? 0 : 12
	}}
>
	<div class="flex min-h-[325px] flex-col px-2 py-2">
		<div class="min-h-[325px] w-full rounded border p-4">
			{#key mstore.start || mstore.end}
				{#if mstore.start && mstore.end}
					{@const days =
						Math.floor(
							Math.abs(
								mstore.start.toDate(getLocalTimeZone()).getTime() -
									mstore.end.toDate(getLocalTimeZone()).getTime()
							)
						) /
						(1000 * 60 * 60 * 24)}

					{#await loadFromDB()}
						<div
							class="grid h-full w-full animate-spin place-content-center justify-center duration-1000"
						>
							<div class="flex h-10 w-10 items-center justify-center">
								<i class="ph ph-spinner text-[50px]"></i>
							</div>
						</div>
					{:then data}
						<Chart
							{data}
							x="date"
							xScale={scaleBand().padding(0.4)}
							y="value"
							yDomain={[0, null]}
							yNice={4}
							padding={{ bottom: 24, left: 16 }}
							tooltip={{ mode: 'band' }}
						>
							<Svg>
								<Axis placement="left" grid rule class="fill-current" />

								{#if days < 10}
									<Axis
										placement="bottom"
										format={(d: string) => format(d, PeriodType.Day, { variant: 'short' })}
										rule
										class="fill-current"
									/>
								{/if}
								<LinearGradient
									class=" from-[rebeccapurple]/30 to-[rebeccapurple]/5"
									vertical
									units="userSpaceOnUse"
									let:gradient
								>
									<Bars
										strokeWidth={0}
										radius={4}
										fill={gradient}
										rounded="top"
										class="stroke-transparent"
									/>
								</LinearGradient>
							</Svg>
							<Tooltip.Root let:data>
								<Tooltip.Header>{data.date}</Tooltip.Header>
								<Tooltip.List>
									<Tooltip.Item label={i18n.t('snapps.fields.hit')} value={data.value} />
								</Tooltip.List>
							</Tooltip.Root>
						</Chart>
					{/await}
				{/if}
			{/key}
		</div>
	</div>
	<Separator />
	<div class="flex h-max w-full gap-2">
		<DateSelector />
	</div>
</div>
