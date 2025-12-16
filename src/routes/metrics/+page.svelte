<script lang="ts">
	import { CalendarDate } from '@internationalized/date';
	import MetricsIcon from '@lucide/svelte/icons/chart-no-axes-combined';
	import ClipboardClockIcon from '@lucide/svelte/icons/clipboard-clock';
	import FunnelIcon from '@lucide/svelte/icons/funnel';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import DatePicker from '$lib/components/blocks/commons/date-picker.svelte';
	import OrganizationStatsCities from '$lib/components/blocks/urls/organization-stats-cities.svelte';
	import OrganizationStatsCountries from '$lib/components/blocks/urls/organization-stats-countries.svelte';
	import OrganizationStatsDevices from '$lib/components/blocks/urls/organization-stats-devices.svelte';
	import OrganizationStatsDonut from '$lib/components/blocks/urls/organization-stats-donut.svelte';
	import OrganizationStatsLanguages from '$lib/components/blocks/urls/organization-stats-languages.svelte';
	import OrganizationStatsOs from '$lib/components/blocks/urls/organization-stats-os.svelte';
	import OrganizationStatsRegions from '$lib/components/blocks/urls/organization-stats-regions.svelte';
	import OrganizationStats from '$lib/components/blocks/urls/organization-stats.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Popover from '$lib/components/ui/popover';
	import * as Select from '$lib/components/ui/select';
	import { m } from '$lib/paraglide/messages';
	import { fillMissingDaysDivided } from '$lib/utils.js';
	import { queryParameters, ssp } from 'sveltekit-search-params';

	const { data } = $props();
	const params = queryParameters(
		{
			filter: ssp.string(),
			from: ssp.string(),
			// eslint-disable-next-line svelte/no-unused-svelte-ignore
			// svelte-ignore state_referenced_locally
			organizationId: ssp.string(data.queriedOrgId || ''),
			to: ssp.string()
		},
		{
			showDefaults: false
		}
	);

	const from = $derived.by(() => {
		const [yyyy, mm, dd]: number[] = (
			data.from.toLocaleDateString('en-CA')?.split('-') ||
			new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7)
				.toLocaleDateString('en-CA')
				.split('-')
		).map((v) => parseInt(v));
		return new CalendarDate(yyyy, mm, dd);
	});

	const to = $derived.by(() => {
		const [yyyy, mm, dd]: number[] = (
			data.to.toLocaleDateString('en-CA')?.split('-') ||
			new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 7)
				.toLocaleDateString('en-CA')
				.split('-')
		).map((v) => parseInt(v));
		return new CalendarDate(yyyy, mm, dd);
	});

	let preset = $state('');

	let utms = $derived<Record<string, string>>(JSON.parse(params.filter || '{}'));
	const current = $derived((params.utms || '')?.split(',').filter(Boolean));
</script>

{#if data.metrics}
	<div class="@container flex w-full grow flex-col divide-y overflow-x-clip">
		<div class="flex h-14 w-full items-center gap-4 border-b p-4">
			<MetricsIcon class="size-8! fill-secondary/50" />
			<h1 class="text-2xl font-bold">{m.metrics()}</h1>
			<div class="ms-auto flex gap-4">
				<Popover.Root>
					<Popover.Trigger
						disabled={!data.metrics.utms || data.metrics.utms?.length === 0}
						class={buttonVariants({ class: 'text-muted-foreground', variant: 'outline' })}
						><FunnelIcon />{m.filter_utm()}</Popover.Trigger
					>
					<Popover.Content align="end">
						<Label>{m.filter_utm()}</Label>
						{#key params.utms?.trim() === ''}
							<Select.Root
								type="multiple"
								onValueChange={(utmKeys) => {
									params.utms = utmKeys.join(',');
									if (utmKeys.length === 0) {
										params.utms = null as unknown as string;
										params.filter = null;
									}
								}}
							>
								<Select.Trigger class="w-full mt-2"
									>{current.length ? current.join(',') : m.select()}</Select.Trigger
								>
								<Select.Content>
									{#each data.metrics.utms as utm (utm)}
										<Select.Item value={utm}>{utm}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/key}
						{#each Object.entries(data.metrics.utmsWithValue) as [utm, values] (utm)}
							<Field.Field class="mt-3">
								<Field.Label>{m.utm()}: [{utm}]</Field.Label>
								<Select.Root
									type="single"
									onValueChange={(utmValue) => {
										if (utms[utm] !== JSON.stringify(utmValue)) {
											utms[utm] = utmValue;
											params.filter = JSON.stringify(utms);
										} else params.filter = null as unknown as string;
									}}
								>
									<ButtonGroup>
										<Button
											variant="outline"
											onclick={() => {
												params.utms = current.filter((c) => c !== utm).join(',');
												delete utms[utm];
												if (Object.entries(utms).length > 0) params.filter = JSON.stringify(utms);
												else params.filter = null as unknown as string;
											}}><TrashIcon /></Button
										>
										<Select.Trigger class="w-full"
											>{utms?.[utm]?.length ? utms?.[utm] : m.select()}</Select.Trigger
										>
									</ButtonGroup>
									<Select.Content>
										{#each values as value, idx (`${idx}-${value}`)}
											<Select.Item {value}>{value}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</Field.Field>
						{/each}
					</Popover.Content>
				</Popover.Root>
				{#if data.organizations.length}
					<Select.Root type="single" bind:value={params.organizationId}>
						<Select.Trigger
							>{params.organizationId
								? data.organizations.find((o) => o.id === params.organizationId)?.name
								: m.select_organization()}</Select.Trigger
						>
						<Select.Content>
							{#each data.organizations as organization (organization.id)}
								<Select.Item value={organization.id}>{organization.name}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				{/if}
			</div>
		</div>
		<div class="flex @5xl:divide-x flex-col divide-y @5xl:flex-row @5xl:divide-y-0">
			<div class="flex flex-col divide-y w-full">
				<div
					class="flex divide-x w-full h-max flex-col @lg:flex-row divide-y @lg:divide-y-0 shrink"
				>
					<div class="p-4 w-full flex items-center">
						<DatePicker
							onValueChange={(d) => {
								params.from = d?.toString() || null;
								preset = '';
							}}
							value={from}
							label={m.from()}
						/>
					</div>
					<div class="p-4 w-full flex items-center">
						<DatePicker
							onValueChange={(d) => {
								params.to = d?.toString() || null;
								preset = '';
							}}
							value={to}
							label={m.to()}
						/>
					</div>
					<div class="p-4 w-full flex items-center">
						<InputGroup.Root>
							<InputGroup.Addon class="min-w-9"
								><ClipboardClockIcon class="size-4!" /></InputGroup.Addon
							>
							<Select.Root
								type="single"
								bind:value={preset}
								onValueChange={() => {
									const end = new Date();
									// eslint-disable-next-line svelte/prefer-svelte-reactivity
									const aWeekAgo = new Date(end);
									// eslint-disable-next-line svelte/prefer-svelte-reactivity
									const twoWeekAgo = new Date(end);
									// eslint-disable-next-line svelte/prefer-svelte-reactivity
									const aMonthAgo = new Date(end);
									// eslint-disable-next-line svelte/prefer-svelte-reactivity
									const sixMonthAgo = new Date(end);
									// eslint-disable-next-line svelte/prefer-svelte-reactivity
									const aYearAgo = new Date(end);
									aWeekAgo.setDate(end.getDate() - 7);
									twoWeekAgo.setDate(end.getDate() - 14);
									aMonthAgo.setDate(end.getDate() - 30);
									sixMonthAgo.setDate(end.getDate() - 180);
									aYearAgo.setDate(end.getDate() - 365);

									switch (preset) {
										case 'month':
											params.from = aMonthAgo.toLocaleDateString('en-CA');
											break;
										case 'six_month':
											params.from = sixMonthAgo.toLocaleDateString('en-CA');
											break;
										case 'two_week':
											params.from = twoWeekAgo.toLocaleDateString('en-CA');
											break;
										case 'week':
											params.from = aWeekAgo.toLocaleDateString('en-CA');
											break;
										case 'year':
											params.from = aYearAgo.toLocaleDateString('en-CA');
											break;
									}

									params.to = end.toLocaleDateString('en-CA');
								}}
							>
								<Select.Trigger class="w-full"
									>{preset === ''
										? m.preset()
										: m?.[`last_${preset}` as 'last_week']?.()}</Select.Trigger
								>
								<Select.Content>
									<Select.Item value="week">{m.last_week()}</Select.Item>
									<Select.Item value="two_week">{m.last_two_week()}</Select.Item>
									<Select.Item value="month">{m.last_month()}</Select.Item>
									<Select.Item value="six_month">{m.last_six_month()}</Select.Item>
									<Select.Item value="year">{m.last_year()}</Select.Item>
								</Select.Content>
							</Select.Root>
						</InputGroup.Root>
					</div>
				</div>
				<div class=" h-full p-4 w-full border-t @lg:border-t-0 min-h-87.5">
					<OrganizationStats
						metrics={fillMissingDaysDivided(
							data.from,
							data.to,
							data.metrics?.visitorOrganizations || []
						)}
					/>
				</div>
			</div>
			<div class="flex @container/donut flex-col min-w-sm @5xl:min-w-lg @5xl:max-w-3xl w-full p-4">
				<OrganizationStatsDonut metrics={data.metrics?.browsers || []} />
			</div>
		</div>
		<div
			class="flex grow divide-y @5xl:divide-y-0 @5xl:divide-x flex-col @5xl:grid @5xl:grid-cols-3"
		>
			<div class="flex p-4 min-h-92.75 grow flex-col">
				<OrganizationStatsCountries metrics={data.metrics?.countries || []} />
			</div>
			<div class="flex p-4 min-h-92.75 grow flex-col">
				<OrganizationStatsRegions metrics={data.metrics?.regions || []} />
			</div>
			<div class="flex p-4 flex-col">
				<OrganizationStatsCities metrics={data.metrics?.cities || []} />
			</div>
		</div>
		<div
			class="flex grow divide-y @5xl:divide-y-0 @5xl:divide-x flex-col @5xl:grid @5xl:grid-cols-3"
		>
			<div class="flex p-4 flex-col">
				<OrganizationStatsDevices metrics={data.metrics?.devices || []} />
			</div>
			<div class="flex p-4 min-h-92.75 grow flex-col">
				<OrganizationStatsOs metrics={data.metrics?.os || []} />
			</div>
			<div class="flex p-4 min-h-92.75 grow flex-col">
				<OrganizationStatsLanguages metrics={data.metrics?.languages || []} />
			</div>
		</div>
	</div>
{/if}
