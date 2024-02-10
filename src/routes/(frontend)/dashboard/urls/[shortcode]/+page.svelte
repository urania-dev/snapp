<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { env } from '$env/dynamic/public';
	import LinkIcon from 'lucide-svelte/icons/link';
	import EditIcon from 'lucide-svelte/icons/pencil';
	import InfinityIcon from 'lucide-svelte/icons/infinity';
	import ShieldIcon from 'lucide-svelte/icons/shield';

	import Breadcrumbs from '$lib/ui/crumbs/breadcrumbs.svelte';
	import { H3, Lead, Paragraph, Small } from '$lib/ui/typography';
	import { getLocale } from '$lib/i18n';
	import { onMount } from 'svelte';
	import Chart from 'chart.js/auto';
	import { browser } from '$app/environment';
	import { getLocalTimeZone, type DateValue, CalendarDate } from '@internationalized/date';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { intlFormatDistance } from 'date-fns';
	import {
		type PaginationSettings,
		Paginator,
		TabGroup,
		Tab,
		SlideToggle
	} from '@skeletonlabs/skeleton';
	import type { SubmitFunction } from './$types.js';
	import { toast } from 'svelte-sonner';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	const { t } = getLocale();

	export let data, form;
	let chartField: HTMLCanvasElement;
	let chart: Chart<'bar', number[], string>;

	function getChartDataPerDay(usages: DBUsages[], start: DateValue, end: DateValue) {
		if (!start || !end) return;
		let currentDate = start.toDate(getLocalTimeZone());
		let endDate = end.toDate(getLocalTimeZone());
		currentDate.setHours(0, 0, 0, 0);
		endDate.setHours(24, 0, 0, 0);
		let labels: string[] = [];
		let counts: number[] = [];

		while (currentDate < endDate) {
			const nextDate = currentDate;
			nextDate.setDate(currentDate.getDate() + 1);

			const count = usages.filter(
				(u) => u.timestamp.split('T')[0] === currentDate.toISOString().split('T')[0]
			).length;

			labels.push(currentDate.toISOString().split('T')[0]);
			counts.push(count);

			currentDate = nextDate;
		}
		return { labels, counts };
	}

	const _end = new Date(data.endingDate);
	let endingDate = new CalendarDate(_end.getFullYear(), _end.getMonth() + 1, _end.getDate());

	const _start = new Date(data.startingDate);
	let startingDate = new CalendarDate(
		_start.getFullYear(),
		_start.getMonth() + 1,
		_start.getDate()
	);

	let usages_per_day = getChartDataPerDay(data.usages, startingDate, endingDate);

	function loadChart({ labels, counts }: { labels: string[]; counts: number[] }) {
		if (!browser || !chartField) return;
		if (chart !== undefined) chart.destroy();
		if (labels.length > 10)
			labels = labels.map((lab) =>
				String(new Date(lab).getDate() + '/' + new Date(lab).getMonth() + 1)
			);
		chart = new Chart(chartField, {
			//Type of the chart
			type: 'bar',
			data: {
				//labels on x-axis
				labels: labels,
				datasets: [
					{
						//The label for the dataset which appears in the legend and tooltips.
						label: $t('graphs:usages:label'),
						//data for the line
						data: counts,
						//styling of the chart
						borderColor: ['transparent'],
						backgroundColor: ['#0fba81'],
						borderWidth: 0
					}
				]
			},

			options: {
				plugins: {
					legend: {
						display: false
					}
				},
				color: fontColor,
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					//make sure Y-axis starts at 0
					x: {
						grid: {
							offset: false
						},
						ticks: {
							color: fontColor
						}
					},
					y: {
						beginAtZero: true,
						grid: {
							offset: false
						},
						grace: 2,
						ticks: {
							color: fontColor
						}
					}
				}
			}
		});
	}

	function initChart() {
		if (chartField && usages_per_day) loadChart(usages_per_day);
	}

	const fontColor = data.theme === 'dark' ? 'white' : 'black';

	onMount(initChart);

	async function handle_date_change() {
		const url = $page.url;
		if (startingDate > endingDate) return;
		if (endingDate < startingDate) return;

		if (startingDate.toString().split('T')[0] !== _start.toISOString().split('T')[0])
			url.searchParams.set('start', startingDate.toString().split('T')[0]);
		if (endingDate.toString().split('T')[0] !== _end.toISOString().split('T')[0])
			url.searchParams.set('end', endingDate.toString().split('T')[0]);

		await goto(url, { invalidateAll: true });

		let _endingDate = new CalendarDate(_end.getFullYear(), _end.getMonth(), _end.getDate());

		let _startingDate = new CalendarDate(
			_start.getFullYear(),
			_start.getMonth() + 1,
			_start.getDate()
		);

		let _usages_per_day = getChartDataPerDay(data.usages, _startingDate, _endingDate);
		if (chartField && _usages_per_day) loadChart(_usages_per_day);
	}

	function show_picker(this: HTMLInputElement) {
		this.showPicker();
	}

	let source: { [key: string]: number } = {};

	getBrowsers(data.usages);

	function getCities(usages: DBUsages[]) {
		let _source: { [key: string]: number } = {};
		usages.map((url) => {
			const { city } = url;
			if (_source[city] !== undefined) _source[city] += 1;
			else _source[city] = 0;
		});

		return _source;
	}

	function getOS(usages: DBUsages[]) {
		usages.map((url) => {
			const { os } = url;
			if (source[os] !== undefined) source[os] += 1;
			else source[os] = 0;
		});

		return source;
	}
	function getDevices(usages: DBUsages[]) {
		usages.map((url) => {
			const { device } = url;
			if (source[device] !== undefined) source[device] += 1;
			else source[device] = 0;
		});

		return source;
	}
	function getBrowsers(usages: DBUsages[]) {
		usages.map((url) => {
			const { browser } = url;
			if (source[browser] !== undefined) source[browser] += 1;
			else source[browser] = 0;
		});

		return source;
	}
	function getRegions(usages: DBUsages[]) {
		usages.map((url) => {
			const { region } = url;
			if (source[region] !== undefined) source[region] += 1;
			else source[region] = 0;
		});

		return source;
	}
	function getCountries(usages: DBUsages[]) {
		usages.map((url) => {
			const { country } = url;
			if (source[country] !== undefined) source[country] += 1;
			else source[country] = 0;
		});

		return source;
	}

	function getRelativeDate(date: Date) {
		const rel = intlFormatDistance(date, new Date(), { locale: data.lang });
		return rel;
	}

	let tablePage = 1;
	let limit = 5;

	let tablePagination = {
		page: tablePage,
		limit,
		size:
			Array.from(Object.entries(source)).length +
			((5 - (Array.from(Object.entries(source)).length % 5)) % 5),
		amounts: []
	} satisfies PaginationSettings;

	function getTable(browsers: { [key: string]: number }, tablePage: number, limit: number) {
		const start = (tablePage - 1) * limit;
		const end = start + limit;

		return Array.from(Object.entries(browsers))
			.sort((a, b) => b[1] - a[1])
			.slice(start, end);
	}

	function handle_change_source(this: HTMLSelectElement) {
		source = {};
		if (this.value === 'browsers') source = getBrowsers(data.usages);
		if (this.value === 'countries') source = getCountries(data.usages);
		if (this.value === 'regions') source = getRegions(data.usages);
		if (this.value === 'cities') source = getCities(data.usages);
		if (this.value === 'os') source = getOS(data.usages);
		if (this.value === 'device') source = getDevices(data.usages);
		sourceArray = getTable(source, tablePage, limit);
	}

	function handle_change_page() {}
	let sourceArray = getTable(source, tablePage, limit);
	$: sourceArray = getTable(source, tablePage, limit);

	let selected_source = 'browsers';
	let tabSet = 0;

	let is_disabled = data.url.disabled;

	function handle_disabled_snapp() {
		document.forms.namedItem('enable-snapp')?.requestSubmit();
	}

	const enhanceSnappDisabled: SubmitFunction = function ({ formData }) {
		formData.set('disabled', `${is_disabled}`);
		return async function ({ result }) {
			await applyAction(result);

			if (result.status === 200 && form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'success'
					}
				});
			else if (form?.message)
				toast.custom(CustomToast, {
					componentProps: {
						message: form?.message,
						state: 'error'
					}
				});
			await invalidateAll();
		};
	};
</script>

<svelte:head
	><title>{$t('global:appname')} | {$t('global:pages:snapp', { id: data.shortcode })}</title
	></svelte:head
>
<form
	id="enable-snapp"
	action="?/enableSnapp"
	method="post"
	use:enhance={enhanceSnappDisabled}
></form>
<div class="page">
	<div class="flex w-full">
		<div class="flex flex-col gap-4">
			<Breadcrumbs
				urls={[
					{ label: $t('global:pages:dashboard'), href: '/dashboard' },
					{ label: $t('global:pages:snapp', { id: data.shortcode }) }
				]}
			/>
			<div class="flex gap-2 items-center">
				<LinkIcon class="w-6 h-6" />
				<H3 class="mb-1 w-max">
					{$t('global:pages:snapp', { id: data.shortcode })}
				</H3>
			</div>
		</div>
		<a href="/dashboard/edit/{data.url.id}" class="ms-auto btn self-center variant-glass flex">
			<EditIcon class="w-4 h-4" />
			<Small class="font-semibold">
				{$t('snapps:more:edit')}
			</Small>
		</a>
		<a href="/{data.shortcode}" target="_blank" class="btn ms-4 self-center variant-filled-primary flex">
			<LinkIcon class="w-4 h-4" />
			<Small class="font-semibold">
				{$t('snapps:visit')}
			</Small>
		</a>
	</div>
	<div class="card w-full overflow-clip">
		<div class="card-header flex">
			<Lead class="align-top">
				{$t('graphs:usages:per:day')}
			</Lead>
			<div class="flex flex-col sm:flex-row gap-4 ms-auto md:items-center">
				<input
					type="date"
					class="input h-8 text-sm flex items-center"
					bind:value={startingDate}
					on:click={show_picker}
					on:change={handle_date_change}
				/>
				<input
					type="date"
					class="input h-8 text-sm flex items-center"
					bind:value={endingDate}
					on:click={show_picker}
					on:change={handle_date_change}
				/>
			</div>
		</div>
		<div class="card-body flex p-4">
			<canvas bind:this={chartField} style="width:100%; height:240px" />
		</div>
	</div>

	<div class="grid lg:grid-cols-2 gap-4">
		<div class="card flex flex-col">
			<div class="card-header px-0">
				<TabGroup>
					<Tab bind:group={tabSet} name="tab1" value={0}>
						<Lead>
							{$t('graphs:snapp:info')}
						</Lead>
					</Tab>
					<Tab bind:group={tabSet} name="tab1" value={1}>
						<Lead>
							{$t('snapps:notes:label')}
						</Lead>
					</Tab>
					<Tab bind:group={tabSet} name="tab1" value={2}>
						<Lead>
							{$t('snapp:disable')}
						</Lead>
					</Tab>
				</TabGroup>
			</div>
			{#if tabSet === 0}
				<div class="card-body p-4 grid grid-cols-2 gap-4">
					<div class="flex flex-col gap-1 mb-2">
						<Small class="font-semibold">
							{$t('snapps:shortcode:label')}
						</Small>
						<a
							href={env.PUBLIC_URL + '/' + data.url.shortcode}
							class="link"
							data-sveltekit-preload-data={false}
						>
							<Paragraph class="font-semibold"
								>{env.PUBLIC_URL + '/' + data.url.shortcode}</Paragraph
							>
						</a>
					</div>
					<div class="flex flex-col gap-1">
						<Small class="font-semibold">
							{$t('snapps:original:url:label')}
						</Small>
						<Paragraph class="font-semibold cursor-default"
							><span title={data.url.original_url}>
								{data.url.original_url.slice(0, 30)}...</span
							></Paragraph
						>
					</div>
					<div class="flex flex-col gap-1">
						<Small class="font-semibold">
							{$t('snapps:columns:created')}
						</Small>
						<Paragraph class="font-semibold cursor-default">
							{getRelativeDate(new Date(data.url.created))}
						</Paragraph>
					</div>
					<div class="flex flex-col gap-1">
						<Small class="font-semibold">
							{$t('snapps:columns:ttl')}
						</Small>
						<Paragraph class="font-semibold cursor-default">
							{#if data.url.ttl !== -1}
								{getRelativeDate(new Date(new Date().getTime() + data.url.ttl * 1000))}
							{:else}
								<InfinityIcon class="w-4 h-4" />
							{/if}
						</Paragraph>
					</div>
					<div class="flex flex-col gap-1">
						<Small class="font-semibold">
							{$t('snapps:has:secret:label')}
						</Small>
						<Paragraph class="font-semibold cursor-default flex gap-2 items-center">
							{#if data.url.has_secret}
								<ShieldIcon class="w-4 h-4" fill="currentColor" />

								{$t('snapps:has:secret:true')}
							{:else}
								{$t('snapps:has:secret:false')}
							{/if}
						</Paragraph>
					</div>
					<div class="flex flex-col gap-1">
						<Small class="font-semibold">
							<div class="flex justify-between">
								<span class="w-full">{$t('snapps:columns:used')}</span>
								<span class="w-full">{$t('snapps:columns:max:usages')} </span>
							</div>
						</Small>
						<div class="flex justify-between items-center">
							{#if data.url.max_usages}
								<Paragraph class="font-semibold w-full cursor-default flex gap-2 items-center">
									{data.url.used}
								</Paragraph>
								<Paragraph
									class="font-semibold w-full cursor-default flex gap-2 items-center mt-[0!important]"
								>
									{data.url.max_usages}
								</Paragraph>
							{:else}
								<Paragraph class="font-semibold w-full cursor-default flex gap-2 items-center">
									{data.url.used}
								</Paragraph>
								<span class="w-full">
									<InfinityIcon class="w-4 h-4" />
								</span>
							{/if}
						</div>
					</div>
					<div class="flex flex-col gap-1">
						<Small class="font-semibold">
							{$t('snapps:columns:status')}
						</Small>

						<div class="badge variant-ghost-primary max-w-max mt-1">
							{$t('snapps:status:' + data.url.status).toLocaleLowerCase()}
						</div>
					</div>
				</div>
			{/if}
			{#if tabSet === 1}
				<div class="card-body full flex-grow hide-scrollbar flex gap-4 ps-[1px] pe-[1px] pb-[1px]">
					<textarea
						name="notes"
						disabled
						class="textarea disabled:text-on-surface-token min-h-60 lg:min-h-[unset] disabled:opacity-[1!important] disabled:cursor-[default!important] border-r-0 border-l-0 border-b-0 rounded-tl-none rounded-tr-none"
						bind:value={data.url.notes}
					/>
				</div>
			{/if}
			{#if tabSet === 2}
				<div class="card-body full flex-col flex-grow hide-scrollbar flex p-4">
					<Paragraph class="max-w-md">{$t('snapp:disable:helper:text')}</Paragraph>
					<Paragraph class="max-w-md">{$t('snapp:disable:helper:usages')}</Paragraph>
					<div class="flex pt-4">
						<Paragraph class="font-semibold me-4">{$t('snapp:disable')}</Paragraph>
						<div class="flex items-center justify-start scale-[.8] self-start">
							<SlideToggle
								size="sm"
								id="is-disabled"
								name="disabled"
								background="bg-surface-300-600-token"
								active="bg-success-300-600-token"
								on:change={handle_disabled_snapp}
								bind:checked={is_disabled}
							/>
						</div>
					</div>
				</div>
			{/if}
		</div>
		<div class="card flex flex-col">
			<div class="card-header">
				<Lead>
					{$t('graphs:audience:by')}
					<select
						class="select inline-flex max-w-max ms-2"
						on:change={handle_change_source}
						bind:value={selected_source}
					>
						<option value="browsers" class="rounded-none">{$t('graphs:browsers')}</option>
						<option value="os" class="rounded-none">{$t('graphs:os')}</option>
						<option value="device" class="rounded-none">{$t('graphs:devices')}</option>
						<option value="countries" class="rounded-none">{$t('graphs:countries')}</option>
						<option value="regions" class="rounded-none">{$t('graphs:regions')}</option>
						<option value="cities" class="rounded-none">{$t('graphs:cities')}</option>
					</select>
				</Lead>
			</div>
			<div class="card-body p-[1px] pt-2">
				<div class="table-container rounded-none">
					<table class="table table-hover variant-glass rounded-none">
						<thead>
							<tr>
								<th><Small class="table-header">{$t('graphs:browser')}</Small></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each sourceArray as [browser, count]}
								<tr>
									<td>
										<Small class="font-semibold">{browser}</Small>
									</td>
									<td class="text-right"> <Small class="font-semibold">{count}</Small></td>
								</tr>
							{/each}
							{#each { length: 5 - Object.entries(source).length } as _}
								<tr>
									<td></td>
									<td></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="card-footer flex w-full p-4">
				<Paginator
					on:page={handle_change_page}
					class="ms-auto"
					bind:settings={tablePagination}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
	</div>
</div>
