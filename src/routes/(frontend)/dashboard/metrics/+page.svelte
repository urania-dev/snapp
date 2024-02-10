<script lang="ts">
	import MapSaveIcon from 'lucide-svelte/icons/locate-fixed';
	import MetricsIcon from 'lucide-svelte/icons/database-zap';
	import { scrollZoom } from '$lib/utils/zoomScroll/index.js';
	import Breadcrumbs from '$lib/ui/crumbs/breadcrumbs.svelte';
	import { H3, Lead, Small } from '$lib/ui/typography';
	import { getLocale } from '$lib/i18n';
	import { onMount } from 'svelte';
	import Map from '$lib/ui/map/world.svg?raw';
	import Chart from 'chart.js/auto';
	import { browser } from '$app/environment';
	import { getLocalTimeZone, type DateValue, CalendarDate } from '@internationalized/date';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		type PaginationSettings,
		Paginator,
		getModalStore,
		type ModalSettings
	} from '@skeletonlabs/skeleton';
	import { applyAction, enhance } from '$app/forms';
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

	let endingDate = new CalendarDate(
		data.endingDate.getFullYear(),
		data.endingDate.getMonth() + 1,
		data.endingDate.getDate()
	);

	let startingDate = new CalendarDate(
		data.startingDate.getFullYear(),
		data.startingDate.getMonth() + 1,
		data.startingDate.getDate()
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
						backgroundColor: ['#1a68a2'],
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

		if (startingDate.toString().split('T')[0] !== data.startingDate.toISOString().split('T')[0])
			url.searchParams.set('start', startingDate.toString().split('T')[0]);
		if (endingDate.toString().split('T')[0] !== data.endingDate.toISOString().split('T')[0])
			url.searchParams.set('end', endingDate.toString().split('T')[0]);

		await goto(url, { invalidateAll: true });

		let _endingDate = new CalendarDate(
			data.endingDate.getFullYear(),
			data.endingDate.getMonth() + 1,
			data.endingDate.getDate()
		);

		let _startingDate = new CalendarDate(
			data.startingDate.getFullYear(),
			data.startingDate.getMonth() + 1,
			data.startingDate.getDate()
		);

		let _usages_per_day = getChartDataPerDay(data.usages, _startingDate, _endingDate);
		if (chartField && _usages_per_day) loadChart(_usages_per_day);
	}

	function show_picker(this: HTMLInputElement) {
		this.showPicker();
	}

	let devices: { [key: string]: number } = getDevices(data.usages);
	let browsers: { [key: string]: number } = getBrowsers(data.usages);
	let countries: { [key: string]: number } = getCountries(data.usages);
	let regions: { [key: string]: number } = getRegions(data.usages);
	let cities: { [key: string]: number } = getCities(data.usages);
	let os: { [key: string]: number } = getOS(data.usages);
	let snapps: { [key: string]: number } = getSnapps(data.usages);

	function getCities(usages: DBUsages[]) {
		let _source: { [key: string]: number } = {};
		usages.map((url) => {
			const { city } = url;
			if (_source[city] !== undefined) _source[city] += 1;
			else _source[city] = 1;
		});

		return _source;
	}

	function getOS(usages: DBUsages[]) {
		let _source: { [key: string]: number } = {};
		usages.map((url) => {
			const { os } = url;
			if (_source[os] !== undefined) _source[os] += 1;
			else _source[os] = 1;
		});

		return _source;
	}
	function getBrowsers(usages: DBUsages[]) {
		let _source: { [key: string]: number } = {};
		usages.map((url) => {
			const { browser } = url;
			if (_source[browser] !== undefined) _source[browser] += 1;
			else _source[browser] = 1;
		});

		return _source;
	}
	function getRegions(usages: DBUsages[]) {
		let _source: { [key: string]: number } = {};
		usages.map((url) => {
			const { region } = url;
			if (_source[region] !== undefined) _source[region] += 1;
			else _source[region] = 1;
		});

		return _source;
	}
	function getCountries(usages: DBUsages[]) {
		let _source: { [key: string]: number } = {};
		usages.map((url) => {
			const { country } = url;
			if (_source[country] !== undefined) _source[country] += 1;
			else _source[country] = 1;
		});

		return _source;
	}
	function getSnapps(usages: (DBUsages & { shortcode: string })[]) {
		let _source: { [key: string]: number } = {};

		usages.map((url) => {
			const { shortcode } = url;
			if (_source[shortcode] !== undefined) _source[shortcode] += 1;
			else _source[shortcode] = 1;
		});
		return _source;
	}
	function getDevices(usages: DBUsages[]) {
		let _source: { [key: string]: number } = {};
		usages.map((url) => {
			const { device } = url;
			if (_source[device] !== undefined) _source[device] += 1;
			else _source[device] = 1;
		});

		return _source;
	}

	let tableBrowserPage = 0;
	let tableOsPage = 0;
	let tableCountriesPage = 0;
	let tableRegionsPage = 0;
	let tableCitiesPage = 0;
	let tableSnappsPage = 0;
	let tableDevicePage = 0;
	let limit = 5;

	let tableBrowsersPagination = {
		page: tableBrowserPage,
		limit,
		size:
			Array.from(Object.entries(browsers)).length +
			((limit - (Array.from(Object.entries(browsers)).length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;
	let tableOSsPagination = {
		page: tableOsPage,
		limit,
		size:
			Array.from(Object.entries(os)).length +
			((limit - (Array.from(Object.entries(os)).length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;
	let tableCountriesPagination = {
		page: tableCountriesPage,
		limit,
		size:
			Array.from(Object.entries(countries)).length +
			((limit - (Array.from(Object.entries(countries)).length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;
	let tableRegionsPagination = {
		page: tableRegionsPage,
		limit,
		size:
			Array.from(Object.entries(regions)).length +
			((limit - (Array.from(Object.entries(regions)).length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;
	let tableCitiesPagination = {
		page: tableCitiesPage,
		limit,
		size:
			Array.from(Object.entries(cities)).length +
			((limit - (Array.from(Object.entries(cities)).length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;
	let tableSnappsPagination = {
		page: tableSnappsPage,
		limit,
		size:
			Array.from(Object.entries(snapps)).length +
			((limit - (Array.from(Object.entries(snapps)).length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;
	let tableDevicesPagination = {
		page: tableDevicePage,
		limit,
		size:
			Array.from(Object.entries(devices)).length +
			((limit - (Array.from(Object.entries(devices)).length % limit)) % limit),
		amounts: []
	} satisfies PaginationSettings;

	function getTable(source: { [key: string]: number }, tablePage: number, limit: number) {
		const start = tablePage * limit;
		const end = start + limit;

		return Array.from(Object.entries(source))
			.sort((a, b) => b[1] - a[1])
			.slice(start, end);
	}

	function handle_change_page(e: CustomEvent, table: string) {
		switch (table) {
			case 'countries':
				tableCountriesPage = e.detail;
				break;

			case 'regions':
				tableRegionsPage = e.detail;
				break;
			case 'cities':
				tableCitiesPage = e.detail;
				break;
			case 'browsers':
				tableBrowserPage = e.detail;
				break;
			case 'os':
				tableOsPage = e.detail;
				break;
			case 'snapps':
				tableSnappsPage = e.detail;
				break;
		}
	}

	let browserSourceArray = getTable(browsers, tableBrowserPage, limit);
	$: browserSourceArray = getTable(browsers, tableBrowserPage, limit);
	let countriesSourceArray = getTable(countries, tableCountriesPage, limit);
	$: countriesSourceArray = getTable(countries, tableCountriesPage, limit);
	let regionsSourceArray = getTable(regions, tableRegionsPage, limit);
	$: regionsSourceArray = getTable(regions, tableRegionsPage, limit);
	let citiesSourceArray = getTable(cities, tableCitiesPage, limit);
	$: citiesSourceArray = getTable(cities, tableCitiesPage, limit);
	let osSourceArray = getTable(os, tableOsPage, limit);
	$: osSourceArray = getTable(os, tableOsPage, limit);
	let snappsSourceArray = getTable(snapps, tableSnappsPage, limit);
	$: snappsSourceArray = getTable(snapps, tableSnappsPage, limit);
	let devicesSourceArray = getTable(devices, tableDevicePage, limit);
	$: devicesSourceArray = getTable(devices, tableDevicePage, limit);

	let saved_position = data.saved_position ?? '';
	onMount(() => {
		const map = document.querySelector('#map');
		if (map) map.setAttribute('style', saved_position);
	});
	const enhanceSaveMapTranslate: SubmitFunction = function ({ formData }) {
		let save = document.querySelector('#map')?.getAttribute('style') ?? saved_position;
		formData.set('position', save);

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

	function save_world_map_position() {
		document.forms.namedItem('save-position')?.requestSubmit();
	}
	async function initMap() {
		const elements = document.getElementsByTagName('path');
		Array.from(elements).map((element) => {
			const countryName =
				element.getAttribute('name') ?? (element.className as unknown as SVGAnimatedString).baseVal;

			element.setAttribute('title', countryName);

			let countryInfo = Array.from(Object.entries(countries)).find(
				([key, value]) => key.toLocaleLowerCase() === countryName.toLocaleLowerCase()
			);
			if (!countryInfo) return;

			const percentage = Math.floor(((countryInfo[1] ?? 0) * 100) / data.usages.length);
			if (percentage > 0) {
				element.setAttribute(
					'style',
					'fill:currentColor; --tw-text-opacity: ' +
						Number(percentage / 100) +
						'; color: rgba(var(--color-primary-500) / var(--tw-text-opacity)) !important;'
				);
			}
			if (element.children[0]?.textContent)
				element.children[0].textContent = countryName + ': ' + (countryInfo[1] ?? 0);

			element.onclick = function (e) {
				e.stopPropagation();
				if (countryInfo) {
					selected_data = countryInfo;
					selected = countryName;
					triggerModalCountry();
				} else {
					countryInfo = undefined;
				}
			};
		});
	}

	let selected_data: [string, number];
	let selected: string;
	onMount(initMap);

	const modalStore = getModalStore();

	function triggerModalCountry() {
		const modalCountry = {
			type: 'alert',
			// Data
			title: $t('snapps:usage:by:country', { country: selected_data[0] }),
			body: $t('snapps:usage', { count: `${selected_data[1]}` }),
			buttonTextCancel: $t('global:misc:close')
		} satisfies ModalSettings;
		modalStore.trigger(modalCountry);
	}
	function triggerModalDeleteExpired() {
		const modalCountry = {
			type: 'confirm',
			// Data
			title: $t('graphs:remove:expired'),
			body: $t('graphs:remove:expired:helper'),
			buttonTextCancel: $t('global:misc:close'),
			buttonTextConfirm: $t('global:misc:confirm'),

			// TRUE if confirm pressed, FALSE if cancel pressed
			response: (r: boolean) => {
				if (r === true) document.forms.namedItem('remove-expired')?.requestSubmit();
			}
		} satisfies ModalSettings;
		modalStore.trigger(modalCountry);
	}

	const enhanceRemoval: SubmitFunction = function () {
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

<svelte:head><title>{$t('global:appname')} | {$t('global:pages:metrics')}</title></svelte:head>
<form action="?/removeExpired" id="remove-expired" method="post" use:enhance={enhanceRemoval} />
<form
	id="save-position"
	method="post"
	action="?/saveMapPosition"
	use:enhance={enhanceSaveMapTranslate}
/>
<div class="page">
	<div class="flex justify-between">
		<div class="flex flex-col gap-4 w-full">
			<Breadcrumbs
				urls={[
					{ label: $t('global:pages:dashboard'), href: '/dashboard' },
					{ label: $t('global:pages:metrics') }
				]}
			/>
			<div class="flex gap-2 w-full items-center">
				<MetricsIcon class="w-6 h-6" />
				<H3 class="mb-1 w-max">
					{$t('global:pages:metrics')}
				</H3>
				<button class="btn variant-glass ms-auto" on:click={triggerModalDeleteExpired}
					>{$t('graphs:remove:expired')}</button
				>
			</div>
		</div>
	</div>
	<div class="card w-full overflow-hidden">
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
	<div class="grid lg:grid-cols-3 gap-4">
		<div class="card flex w-full flex-col col-span-2">
			<div class="card-header justify-between flex">
				<Lead>
					{$t('graphs:map')}
				</Lead>
				<button
					class="btn variant-ghost h-10 py-0 flex items-center justify-center gap-0 p-2"
					on:click={save_world_map_position}
				>
					<MapSaveIcon class="w-4 h-4" />
					<Small class="font-semibold">
						{$t('graphs:map:save:position')}
					</Small>
				</button>
			</div>
			<div class="card-body flex items-start w-full h-full p-4">
				<div class="h-full w-full overflow-hidden" use:scrollZoom={{ maxScale: 12, factor: 0.25 }}>
					{@html Map}
				</div>
			</div>
			<div class="card-footer">
				<Small>{@html $t('graphs:map:instructions')}</Small>
			</div>
		</div>
		<div class="card flex flex-col col-span-2 lg:col-span-1">
			<div class="card-header">
				<Lead>
					{$t('graphs:countries')}
				</Lead>
			</div>
			<div class="card-body p-[1px] pt-4">
				<div class="table-container rounded-none">
					<table class="table table-hover variant-glass rounded-none">
						<thead>
							<tr>
								<th><Small class="table-header">{$t('graphs:countries')}</Small></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each countriesSourceArray as [country, count]}
								<tr>
									<td>
										<Small class="font-semibold"
											>{country.replace('undefined', $t('graphs:undefined'))}</Small
										>
									</td>
									<td class="text-right"> <Small class="font-semibold">{count}</Small></td>
								</tr>
							{/each}
							{#each { length: 5 - Object.entries(countries).length } as _}
								<tr>
									<td></td>
									<td></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="card-footer flex w-full p-4 mt-auto">
				<Paginator
					on:page={(e) => handle_change_page(e, 'countries')}
					class="ms-auto"
					bind:settings={tableCountriesPagination}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
	</div>
	<div class="grid lg:grid-cols-3 gap-4 mb-4">
		<div class="card flex flex-col">
			<div class="card-header">
				<Lead>
					{$t('graphs:regions')}
				</Lead>
			</div>
			<div class="card-body p-[1px] pt-4">
				<div class="table-container rounded-none">
					<table class="table table-hover variant-glass rounded-none">
						<thead>
							<tr>
								<th><Small class="table-header">{$t('graphs:regions')}</Small></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each regionsSourceArray as [region, count]}
								<tr>
									<td>
										<Small class="font-semibold"
											>{region.replace('undefined', $t('graphs:undefined'))}</Small
										>
									</td>
									<td class="text-right"> <Small class="font-semibold">{count}</Small></td>
								</tr>
							{/each}
							{#each { length: 5 - Object.entries(regions).length } as _}
								<tr>
									<td></td>
									<td></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="card-footer flex w-full p-4 mt-auto">
				<Paginator
					on:page={(e) => handle_change_page(e, 'regions')}
					class="ms-auto"
					bind:settings={tableRegionsPagination}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
		<div class="card flex flex-col">
			<div class="card-header">
				<Lead>
					{$t('graphs:cities')}
				</Lead>
			</div>
			<div class="card-body p-[1px] pt-4">
				<div class="table-container rounded-none">
					<table class="table table-hover variant-glass rounded-none">
						<thead>
							<tr>
								<th><Small class="table-header">{$t('graphs:cities')}</Small></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each citiesSourceArray as [city, count]}
								<tr>
									<td>
										<Small class="font-semibold"
											>{city.replace('undefined', $t('graphs:undefined'))}</Small
										>
									</td>
									<td class="text-right"> <Small class="font-semibold">{count}</Small></td>
								</tr>
							{/each}
							{#each { length: 5 - Object.entries(cities).length } as _}
								<tr>
									<td></td>
									<td></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="card-footer flex w-full p-4 mt-auto">
				<Paginator
					on:page={(e) => handle_change_page(e, 'cities')}
					class="ms-auto"
					bind:settings={tableCitiesPagination}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
		<div class="card flex flex-col">
			<div class="card-header">
				<Lead>
					{$t('global:sections:snapps')}
				</Lead>
			</div>
			<div class="card-body p-[1px] pt-4">
				<div class="table-container rounded-none">
					<table class="table table-hover variant-glass rounded-none">
						<thead>
							<tr>
								<th><Small class="table-header">{$t('global:sections:snapps')}</Small></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each snappsSourceArray as [snapp, count]}
								<tr>
									<td>
										{#if !snapp.startsWith('-- expired -')}
											<a href="/{snapp}" class="link" data-sveltekit-preload-data={false}>
												<Small class="font-semibold">{snapp}</Small>
											</a>
										{:else}
											<Small class="font-semibold">{$t('graphs:expired')}</Small>
										{/if}
									</td>
									<td class="text-right"> <Small class="font-semibold">{count}</Small></td>
								</tr>
							{/each}
							{#each { length: 5 - Object.entries(snapps).length } as _}
								<tr>
									<td></td>
									<td></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="card-footer flex w-full p-4 mt-auto">
				<Paginator
					on:page={(e) => handle_change_page(e, 'snapps')}
					class="ms-auto"
					bind:settings={tableSnappsPagination}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
		<div class="card flex flex-col">
			<div class="card-header">
				<Lead>
					{$t('graphs:os')}
				</Lead>
			</div>
			<div class="card-body p-[1px] pt-4">
				<div class="table-container rounded-none">
					<table class="table table-hover variant-glass rounded-none">
						<thead>
							<tr>
								<th><Small class="table-header">{$t('graphs:os')}</Small></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each osSourceArray as [_os, count]}
								<tr>
									<td>
										<Small class="font-semibold"
											>{_os.replace('undefined', $t('graphs:undefined'))}</Small
										>
									</td>
									<td class="text-right"> <Small class="font-semibold">{count}</Small></td>
								</tr>
							{/each}
							{#each { length: 5 - Object.entries(os).length } as _}
								<tr>
									<td></td>
									<td></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="card-footer flex w-full p-4 mt-auto">
				<Paginator
					on:page={(e) => handle_change_page(e, 'os')}
					class="ms-auto"
					bind:settings={tableOSsPagination}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
		<div class="card flex flex-col">
			<div class="card-header">
				<Lead>
					{$t('graphs:browsers')}
				</Lead>
			</div>
			<div class="card-body p-[1px] pt-4">
				<div class="table-container rounded-none">
					<table class="table table-hover variant-glass rounded-none">
						<thead>
							<tr>
								<th><Small class="table-header">{$t('graphs:browser')}</Small></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each browserSourceArray as [browser, count]}
								<tr>
									<td>
										<Small class="font-semibold"
											>{browser.replace('undefined', $t('graphs:undefined'))}</Small
										>
									</td>
									<td class="text-right"> <Small class="font-semibold">{count}</Small></td>
								</tr>
							{/each}
							{#each { length: 5 - Object.entries(browsers).length } as _}
								<tr>
									<td></td>
									<td></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="card-footer flex w-full p-4 mt-auto">
				<Paginator
					on:page={(e) => handle_change_page(e, 'browsers')}
					class="ms-auto"
					bind:settings={tableBrowsersPagination}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
		<div class="card flex flex-col">
			<div class="card-header">
				<Lead>
					{$t('graphs:devices')}
				</Lead>
			</div>
			<div class="card-body p-[1px] pt-4">
				<div class="table-container rounded-none">
					<table class="table table-hover variant-glass rounded-none">
						<thead>
							<tr>
								<th><Small class="table-header">{$t('graphs:devices')}</Small></th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each devicesSourceArray as [device, count]}
								<tr>
									<td>
										<Small class="font-semibold"
											>{device.replace('undefined', $t('graphs:undefined'))}</Small
										>
									</td>
									<td class="text-right"> <Small class="font-semibold">{count}</Small></td>
								</tr>
							{/each}
							{#each { length: 5 - Object.entries(devices).length } as _}
								<tr>
									<td></td>
									<td></td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
			<div class="card-footer flex w-full p-4 mt-auto">
				<Paginator
					on:page={(e) => handle_change_page(e, 'devices')}
					class="ms-auto"
					bind:settings={tableBrowsersPagination}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
	</div>
</div>
