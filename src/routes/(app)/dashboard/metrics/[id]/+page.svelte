<script lang="ts">
	let { data } = $props();
	import Map from '$lib/comps/map/world.svg?raw';
	import { scrollZoom } from '$lib/utils/zoomScroll.svelte.js';

	let { countries, os, browser, devices, _theme } = $derived(data);
	let selected: string | undefined = $state();
	const totalUses = $derived(data.totalUses ?? countries.reduce((a, b) => a + b._count, 0));
	let selected_data: any;
	let chartField = $state<HTMLDivElement>();
	function trackCountry() {
		const elements = document.getElementsByTagName('path');
		Array.from(elements).map((element) => {
			const countryName =
				element.getAttribute('name') ?? (element.className as unknown as SVGAnimatedString).baseVal;

			element.setAttribute('title', countryName);
			let countryInfo = countries.find((use) => use.country === countryName);
			const percentage = Math.floor(((countryInfo?._count ?? 0) * 100) / totalUses);
			if (percentage > 0) {
				element.setAttribute(
					'style',
					'fill:currentColor; --bs-text-opacity: ' +
						Number(percentage / 100) +
						'; color: rgba(var(--tblr-primary-rgb), var(--bs-text-opacity)) !important;'
				);
			}
			if (element.children[0]?.textContent)
				element.children[0].textContent = countryName + ': ' + (countryInfo?._count ?? 0);

			element.onclick = function (e) {
				e.stopPropagation();
				if (countryInfo) selected_data = countryInfo;
				else countryInfo = undefined;
				selected = countryName;
			};
		});
	}

	function initCharts() {
		loadApexCharts();
	}
	var chart: globalThis.ApexCharts;
	async function loadApexCharts() {
		const ApexCharts = (await import('apexcharts')).default;
		var options = {
			chart: {
				type: 'area',
				height: '100%',
				toolbar: {
					show: false
				},
				animations: { enabled: false }
			},
			dataLabels: {
				enabled: false
			},
			stroke: {
				curve: 'smooth',
				lineCap: 'butt'
			},
			theme: {
				mode: _theme
			},
			series: [
				{
					name: 'Usages',
					data: data.usagesPerDay.map((u) => u.count)
				}
			],
			yaxis: {
				labels: { show: false }
			},
			xaxis: {
				categories: data.usagesPerDay.map((u) => u.day),
				labels: { show: false },
				tooltip: {
					enabled: false
				}
			},
			grid: {
				borderColor: 'transparent',
				yaxis: {
					lines: {
						show: false
					}
				}
			}
		};

		chart = new ApexCharts(chartField, options);

		chart.render();
	}

	$effect(initCharts);
	$effect(trackCountry);
</script>

<svelte:head>
	<title>Metrics | Snapp.li | Code: {data.snapp.short_code}</title>
	<link
		rel="stylesheet"
		href="https://cdn.jsdelivr.net/npm/@tabler/core@1.0.0-beta17/dist/css/tabler-flags.min.css"
	/>
</svelte:head>
<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row g-2 align-items-center">
			<div class="col">
				<div class="page-pretitle">Metrics</div>
				<h2 class="page-title mt-2 ps-2 fs-1 fw-bolder">~/{data.snapp?.short_code}</h2>
			</div>
			<div class="col-auto ms-auto">
				<div class="btn-list">
					<span class="d-sm-inline">
						<a href="/dashboard/metrics" class="btn btn-tertiary btn-md d-flex gap-2 h-100">
							<i class="ti ti-door"></i>
							<span>Go back <span class="d-none d-lg-inline">to metrics</span></span></a
						>
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
<div class="page-body">
	<div class="container-xl">
		<div class="row row-deck row-cards">
			<div class="col-lg-12">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title w-100 d-flex align-items-center justify-content-between">
							<span>Snapp Data</span>
						</h3>
					</div>
					<div class="card-body">
						<div class="datagrid">
							<div class="datagrid-item">
								<div class="datagrid-title">Original url</div>
								<div class="datagrid-content d-flex align-items-center gap-2 lh-lg">
									{data.snapp.original_url}
								</div>
							</div>
						</div>
						<div class="datagrid mt-4">
							<div class="datagrid-item">
								<div class="datagrid-title">Secret</div>
								<div
									class="datagrid-content d-flex align-items-center gap-2 lh-lg d-flex align-items-center gap-2"
								>
									{#if data.snapp.has_secret}
										<i class="text-success ti ti-shield-check lh-base fs-2"></i>
										<span>Protected</span>
									{:else}
										<span class="text-secondary">None</span>
									{/if}
								</div>
							</div>
							<div class="datagrid-item">
								<div class="datagrid-title">Total Hits</div>
								<div
									class="datagrid-content d-flex align-items-center gap-2 lh-lg text-primary fw-bold"
								>
									{totalUses}
								</div>
							</div>
							<div class="datagrid-item">
								<div class="datagrid-title">Created</div>
								<div class="datagrid-content d-flex align-items-center gap-2 lh-lg">
									{new Date(data.snapp.created_at).toLocaleDateString('en-GB')}
								</div>
							</div>

							<div class="datagrid-item">
								<div class="datagrid-title">Expiration</div>
								<div
									class="datagrid-content d-flex align-items-center gap-2 lh-lg text-warning"
									class:text-secondary={!!!data.snapp?.expires_at}
								>
									{(data.snapp?.expires_at &&
										new Date(data.snapp.expires_at).toLocaleDateString('en-GB')) ||
										'None'}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<div class="col-lg-12 col-xl-8" style:max-height="30rem">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title w-100 d-flex align-items-center justify-content-between">
							<span>Map</span>
							<div class="fs-5 d-flex align-items-center">
								<span class="pe-2 fw-normal">Zoom with</span> <kbd>ctrl + Mouse Wheel</kbd>
							</div>
						</h3>
					</div>
					<div
						class="card-body d-flex ratio ratio-16x9 overflow-hidden p-0"
						use:scrollZoom={{ maxScale: 10, factor: 0.25 }}
					>
						{@html Map}
					</div>
				</div>
			</div>

			<div class="col-xl-4 col-lg-6" style:max-height="30rem">
				<div class="card p-0">
					<div class="card-header">
						<h3 class="card-title w-100 d-flex">
							<span>Origin</span>
						</h3>
					</div>
					<div class="card-body card-body-scrollable card-body-scrollable-shadow p-0">
						<table class="table card-table table-vcenter">
							<thead class="sticky-head">
								<tr>
									<th>Country</th>
									<th colspan="2" class="text-end">Visitors</th>
								</tr>
							</thead>
							<tbody>
								{#each countries as { country, _count, short }}
									<tr>
										<td class="d-flex align-items-center">
											{#if short !== 'null'}<span
													class="flag flag-xs flag-country-{short?.toLowerCase()} border radius-none overflow-hidden me-2"
												/>{/if}
											<span class="fs-5">{country}</span>
										</td>
										<td class="fs-5">{_count}</td>
										<td class="w-50">
											<div class="progress progress-xs">
												<div
													class="progress-bar bg-primary"
													style="width: {Math.floor(((_count ?? 0) * 100) / totalUses)}%"
												></div>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
			<div class="col-xl-12 col-lg-6" style:height="340px">
				<div class="card p-0">
					<div class="card-header">
						<h3 class="card-title">Traffic flow</h3>
					</div>
					<div class="card-body p-0">
						<div id="chart" bind:this={chartField}></div>
					</div>
				</div>
			</div>
			<div class="col-lg-4 col-md-6" style:height="18.75rem">
				<div class="card p-0">
					<div class="card-header">
						<h3 class="card-title w-100 d-flex">
							<span>Browser</span>
						</h3>
					</div>
					<div class="card-body card-body-scrollable card-body-scrollable-shadow p-0">
						<table class="table card-table table-vcenter">
							<thead class="sticky-head">
								<tr>
									<th>Browser</th>
									<th colspan="2" class="text-end">Count</th>
								</tr>
							</thead>
							<tbody>
								{#each browser as { browser: name, _count }}
									<tr>
										<td class="d-flex align-items-center">
											<span class="fs-5">{name}</span>
										</td>
										<td class="fs-5">{_count}</td>
										<td class="w-50">
											<div class="progress progress-xs">
												<div
													class="progress-bar bg-primary"
													style="width: {Math.floor(((_count ?? 0) * 100) / totalUses)}%"
												></div>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div class="col-lg-4 col-md-6" style:height="18.75rem">
				<div class="card p-0">
					<div class="card-header">
						<h3 class="card-title w-100 d-flex">
							<span>Operating System</span>
						</h3>
					</div>
					<div class="card-body card-body-scrollable card-body-scrollable-shadow p-0">
						<table class="table card-table table-vcenter">
							<thead class="sticky-head">
								<tr>
									<th>OS</th>
									<th colspan="2" class="text-end">Uses</th>
								</tr>
							</thead>
							<tbody>
								{#each os as { os: name, _count }}
									<tr>
										<td class="d-flex align-items-center">
											<span class="fs-5">{name}</span>
										</td>
										<td class="fs-5">{_count}</td>
										<td class="w-50">
											<div class="progress progress-xs">
												<div
													class="progress-bar bg-primary"
													style="width: {Math.floor(((_count ?? 0) * 100) / totalUses)}%"
												></div>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div class="col-lg-4 col-md-6" style:height="18.75rem">
				<div class="card p-0">
					<div class="card-header">
						<h3 class="card-title w-100 d-flex">
							<span>Devices</span>
						</h3>
					</div>
					<div class="card-body card-body-scrollable card-body-scrollable-shadow p-0">
						<table class="table card-table table-vcenter">
							<thead class="sticky-head">
								<tr>
									<th>Devices</th>
									<th colspan="2" class="text-end">Count</th>
								</tr>
							</thead>
							<tbody>
								{#each devices as { device: name, _count }}
									<tr>
										<td class="d-flex align-items-center">
											<span class="fs-5">{name}</span>
										</td>
										<td class="fs-5">{_count}</td>
										<td class="w-50">
											<div class="progress progress-xs">
												<div
													class="progress-bar bg-primary"
													style="width: {Math.floor(((_count ?? 0) * 100) / totalUses)}%"
												></div>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
