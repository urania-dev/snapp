<script lang="ts">
	import { getLocalTimeZone } from "@internationalized/date";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { getMetricsStore } from "$lib/stores/metrics.svelte";
	import { scaleBand } from "d3-scale";
	import { Axis, Bars, Chart, LinearGradient, Svg, Tooltip } from "layerchart";
	import { prefersReducedMotion } from "svelte/motion";
	import { fly } from "svelte/transition";

	const i18n = getTranslations();
	const mstore = getMetricsStore();
</script>

<div
	class="flex min-h-max w-full flex-col gap-2 py-2"
	in:fly={{
		duration: 400,
		opacity: prefersReducedMotion.current ? 1 : 0,
		y: prefersReducedMotion.current ? 0 : 12
	}}
>
	<div class="flex h-max min-h-[325px] flex-col px-2">
		<div class="h-max min-h-[325px] w-full rounded border p-4">
			{#key mstore.start || mstore.end}
				{#await mstore.loadFromDb()}
					<div
						class="grid h-full w-full animate-spin place-content-center justify-center duration-1000"
					>
						<div class="flex h-10 w-10 items-center justify-center">
							<i class="ph ph-spinner text-[50px]"></i>
						</div>
					</div>
				{:then data}
					{@const days = Math.floor(
						Math.abs(
							mstore.start.toDate(getLocalTimeZone()).getTime() -
								mstore.end.toDate(getLocalTimeZone()).getTime()
						) /
							(1000 * 60 * 60 * 24)
					)}
					<Chart
						{data}
						x="date"
						xScale={scaleBand().padding(0.4)}
						y="value"
						yDomain={[0, null]}
						yNice={4}
						padding={{ bottom: 24, left: 16 }}
						tooltip={{ mode: "band" }}
						height={325}
					>
						<Svg>
							<Axis placement="left" grid rule class="fill-current" />
							{#if days < 14}
								<Axis placement="bottom" format={(d: string) => d} rule class="fill-current" />
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
								<Tooltip.Item label={i18n.t("snapps.fields.hit")} value={data.value} />
							</Tooltip.List>
						</Tooltip.Root>
					</Chart>
				{/await}
			{/key}
		</div>
	</div>
</div>
