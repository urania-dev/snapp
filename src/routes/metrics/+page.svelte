<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Chart from '$lib/ui/chart.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import { _ } from 'svelte-i18n';
	let { data } = $props();
	const get_dates = () => {
		let dataset: number[] = [];
		let labels: string[] = [];

		const days = Math.abs(
			Math.floor((data.end.getTime() - data.start.getTime()) / 1000 / 60 / 60 / 24)
		);

		const date = data.start;

		for (let i = 0; i <= days; i++) {
			const dateString = date.toISOString().split('T')[0];

			if (data.metrics.hasOwnProperty(dateString)) {
				dataset.push(data.metrics[dateString]);
			} else {
				dataset.push(0);
			}
			labels.push(dateString);

			date.setDate(date.getDate() + 1);
		}
		return {
			dataset,
			labels
		};
	};
	const chartData = $derived(get_dates());

	import Map from '$lib/ui/map.svelte';
	import Select from '$lib/ui/select.svelte';
	import { translateCountry } from '$lib/utils/language';
	import { queryParam } from 'sveltekit-search-params';

	let countryID = queryParam('country');
	let country = $state<string>();
	let browsers = queryParam<string>('browser');
	let os = queryParam<string>('os');
	let device = queryParam<string>('device');
	let dataset = $derived(data.countries);
</script>

<svelte:head>
	<title>{$_('appname')} | {$_('menu.metrics')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
<div class="flex w-full h-max lg:h-unset flex-col lg:overflow-clip p-4">
	<div class="mx-auto flex lg:min-h-full w-full max-w-5xl flex-col gap-4 overflow-clip">
		<h2 class="flex items-center gap-2 text-2xl font-bold">
			<Icon ph="presentation-chart" size={36} />
			<span>{$_('menu.metrics')}</span>
		</h2>
		<div class="flex w-full flex-col gap-4 lg:flex-row">
			{#key [data.start, data.end]}
				<Card css={{ card: 'flex-row w-full' }}>
					<Chart
						label={$_('snapps.fields.hit')}
						total_count={data.totalVisits}
						css={{ container: 'h-64' }}
						data={chartData}
						start={data.start}
						end={data.end}
					></Chart>
				</Card>
			{/key}
			<Card css={{ card: 'lg:max-w-sm gap-4' }}>
				<h4 class="mb-auto flex w-full items-center gap-2 text-lg font-semibold">
					<Icon ph="funnel"></Icon>
					<span>
						{$_('metrics.filters')}
					</span>
				</h4>
				<Select
					label={$_('metrics.origin')}
					items={[
						{ id: 'world', value: $_('globals.world') },
						...data.countries
							.filter((i) => i.id !== null && i.name !== null)
							.map((i) => ({ id: i.id!, value: translateCountry(data.lang, i.id!) }))
					]}
					placeholder={$_('globals.world')}
					actions={{
						select: (e) => {
							e.preventDefault();
							e.stopPropagation();
							const idx = e.currentTarget.dataset.idx;
							if (!idx) return;
							country = idx === 'world' ? $_('globals.world') : translateCountry(data.lang, idx);
							$countryID = idx === 'world' ? 'World' : translateCountry('en', idx);
						}
					}}
					name="field"
					bind:value={country}
				/>
				<Select
					label={$_('metrics.browser')}
					items={[
						{ id: 'all', value: $_('globals.all') },
						...data.browsers
							.filter((i) => i.id !== null && i.name !== null)
							.map((i) => ({ id: i.id!, value: i.name || 'not-set' }))
					]}
					placeholder={$_('globals.all')}
					actions={{
						select: (e) => {
							e.preventDefault();
							e.stopPropagation();
							const idx = e.currentTarget.dataset.idx;
							if (!idx) return;
							$browsers = idx;
						}
					}}
					name="field"
					bind:value={$browsers}
				/>
				<Select
					label={$_('metrics.os')}
					items={[
						{ id: 'all', value: $_('globals.all') },
						...data.oss
							.filter((i) => i.id !== null && i.name !== null)
							.map((i) => ({ id: i.id!, value: i.name || 'not-set' }))
					]}
					placeholder={$_('globals.all')}
					actions={{
						select: (e) => {
							e.preventDefault();
							e.stopPropagation();
							const idx = e.currentTarget.dataset.idx;
							if (!idx) return;
							$os = idx;
						}
					}}
					name="field"
					bind:value={$os}
				/>
				<Select
					label={$_('metrics.device')}
					items={[
						{ id: 'all', value: $_('globals.all') },
						...data.devices
							.filter((i) => i.id !== null && i.name !== null)
							.map((i) => ({ id: i.id!, value: i.name || 'not-set' }))
					]}
					placeholder={$_('globals.all')}
					actions={{
						select: (e) => {
							e.preventDefault();
							e.stopPropagation();
							const idx = e.currentTarget.dataset.idx;
							if (!idx) return;
							$device = idx;
						}
					}}
					name="field"
					bind:value={$device}
				/>
			</Card>
		</div>

		<Card css={{ card: 'w-full aspect-[4/2] lg:aspect-[4/1.5] mb-4' }}>
			<Map theme={data.theme} data={dataset}></Map>
		</Card>
	</div>
</div>
