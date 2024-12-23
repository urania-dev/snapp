<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';
	import Input from './input.svelte';
	import { _ } from 'svelte-i18n';
	import { queryParameters } from 'sveltekit-search-params';
	import { type DateValue, CalendarDate } from '@internationalized/date';

	let {
		css,
		data,
		total_count,
		label,
		end,
		start
	}: {
		css?: { [key: string]: string };
		data: { labels: string[]; dataset: any[] };
		total_count?: number;
		label?: string;
		start: Date;
		end: Date;
	} = $props();
	let element = $state<HTMLCanvasElement>();
	onMount(() => {
		if (!element) return;
		new Chart(element, {
			type: 'bar',
			data: {
				labels: data.labels,
				datasets: [
					{
						data: data.dataset,
						borderWidth: 1
					}
				]
			},
			options: {
				plugins: {
					legend: {
						display: false
					}
				},
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					//make sure Y-axis starts at 0
					x: {
						grid: {
							offset: false
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							offset: false
						},
						grace: 2
					}
				}
			}
		});
	});

	let clientWidth = $state(0);
	let clientHeight = $state(0);
	const _start = new CalendarDate(start.getFullYear(), start.getMonth() + 1, start.getDate());
	const _end = new CalendarDate(end.getFullYear(), end.getMonth() + 1, end.getDate());
	const params = queryParameters(
		{
		'start':{

			defaultValue: _start,
			encode: (value) => value.toString(),
			decode: (value) => {
				if (!value) return null;
				const date = new Date(value);
				return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
			}
		},
		end:{
			defaultValue: _end,
			encode: (value) => value.toString(),
			decode: (value) => {
				if (!value) return null;
				const date = new Date(value);
				return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
			}
		},
	}
	);

	
</script>

<div class="relative flex h-full w-full flex-col">
	{#if label}<h4 class="font-sm mb-2 font-semibold">{label}</h4>{/if}
	<div class={cn('relative h-full w-full', css?.['container'])} bind:clientWidth bind:clientHeight>
		<canvas height={clientHeight} bind:this={element}></canvas>
	</div>
	<div class="flex max-h-20">
		{#if total_count}
			<div class="absolute right-0 top-0 flex h-full justify-start md:static md:items-end">
				<small class="flex font-semibold">
					{$_('globals.total')}: {total_count}
				</small>
			</div>
		{/if}
		<div class="ms-auto mt-4 flex h-auto w-full max-w-sm gap-4 text-sm">
			<Input
				name="start"
				label={$_('globals.start')}
				type="date"
				bind:date={params.start}
				actions={{
					focus: (e) => {
						(e.currentTarget as HTMLInputElement)?.showPicker();
					}
				}}
			/>
			<Input
				name="end"
				label={$_('globals.end')}
				type="date"
				bind:date={params.end}
				actions={{
					focus: (e) => {
						(e.currentTarget as HTMLInputElement)?.showPicker();
					}
				}}
			/>
		</div>
	</div>
</div>
