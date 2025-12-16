<script lang="ts">
	import { CalendarDate } from '@internationalized/date';
	import AlarmClockIcon from '@lucide/svelte/icons/alarm-clock';
	import BrickWallShieldIcon from '@lucide/svelte/icons/brick-wall-shield';
	import CaseSensitiveIcon from '@lucide/svelte/icons/case-sensitive';
	import ChartIcon from '@lucide/svelte/icons/chart-area';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import ClipboardClockIcon from '@lucide/svelte/icons/clipboard-clock';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import HashIcon from '@lucide/svelte/icons/hash';
	import LinkIcon from '@lucide/svelte/icons/link-2';
	import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import QrCodeIcon from '@lucide/svelte/icons/qr-code';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import TagIcon from '@lucide/svelte/icons/tag';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import DatePicker from '$lib/components/blocks/commons/date-picker.svelte';
	import Dialog from '$lib/components/blocks/commons/dialog.svelte';
	import Notes from '$lib/components/blocks/commons/notes.svelte';
	import NumberCard from '$lib/components/blocks/commons/number-card.svelte';
	import { CopyButton } from '$lib/components/blocks/copy-button';
	import SingleUrlStats from '$lib/components/blocks/urls/single-url-stats.svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Item from '$lib/components/ui/item';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/native-select';
	import { Switch } from '$lib/components/ui/switch';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { toggleURL } from '$lib/remotes/urls.remote';
	import { formatTimeAgo, slugify, underscore } from '$lib/utils.js';
	import { toast } from 'svelte-sonner';
	import { SvelteURL } from 'svelte/reactivity';
	import { queryParameters, ssp } from 'sveltekit-search-params';
	import { renderSVG } from 'uqr';

	const { data } = $props();
	const completeURL = $derived(new SvelteURL(data.url.shortcode, data.host.origin).href);
	const qrCode = $derived(
		renderSVG(completeURL || '', {
			blackColor: 'var(--foreground)',
			whiteColor: 'var(--background)'
		})
	);
	let showQRCode = $state(false);

	const params = queryParameters(
		{
			from: ssp.string(),
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
	let showUTM = $state(false);
</script>

<div class="@container flex w-full grow flex-col divide-y">
	<div
		class="flex sticky flex-col @3xl:flex-row @x3l:divide-y-0 divide-y top-0 bg-background! z-20 @3xl:h-14 w-full items-center @3xl:gap-4 p-0"
	>
		<div class="flex gap-2 items-center w-full p-4 h-14">
			<LinkIcon class="size-8! fill-secondary/50" />
			<h1 class="text-2xl font-bold whitespace-nowrap">{data.url.shortcode}</h1>
		</div>
		<div class="flex gap-2 items-center p-4 w-full @3xl:w-max h-14 @3xl:border-s">
			<Button size="icon" variant="outline" href={resolve(`/metrics?urlId=${data.url.id}`)}
				><ChartIcon /></Button
			>
			<Button size="icon" variant="outline" href={resolve(`/urls/edit/[id]`, { id: data.url.id })}
				><PencilIcon /></Button
			>
			<CopyButton variant="outline" text={completeURL} />
			<Button
				variant="outline"
				onclick={() => {
					showQRCode = true;
				}}><QrCodeIcon /></Button
			>
			<Button href={completeURL} target="_blank" variant="outline" class="ms-auto @xl:m-0"
				><ExternalLinkIcon />{m.open()}</Button
			>
		</div>
	</div>
	<div class="flex flex-col grow @4xl:flex-row @container @xl:divide-x divide-y @xl:divide-y-0">
		<div class="flex order-1 @lg:order-0 divide-y grow flex-col h-full w-full">
			<div class="p-4 w-full border-t @lg:border-t-0">
				<SingleUrlStats chartData={data.stats} />
			</div>
			<div class="flex divide-x w-full h-max flex-col @lg:flex-row divide-y @lg:divide-y-0 shrink">
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
							bind:value={preset}
							onchange={() => {
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
							<Select.Option value="">{m.preset()}</Select.Option>
							<Select.Option value="week">{m.last_week()}</Select.Option>
							<Select.Option value="two_week">{m.last_two_week()}</Select.Option>
							<Select.Option value="month">{m.last_month()}</Select.Option>
							<Select.Option value="six_month">{m.last_six_month()}</Select.Option>
							<Select.Option value="year">{m.last_year()}</Select.Option>
						</Select.Root>
					</InputGroup.Root>
				</div>
			</div>
			<div class="p-4 flex grow">
				<Notes
					notes={data.url.notes || undefined}
					placeholder={m.urls_notes_helper()}
					readonly={true}
				/>
			</div>
		</div>
		<div class="flex w-full grow divide-y flex-col order-0 @lg:order-1">
			<div class="flex flex-col w-full p-4 h-max">
				<Label class="text-base">{m.url_details()}</Label>
			</div>
			<div class="flex flex-col p-4 h-[123.5px]">
				<Field.Label class="h-full">
					<Field.Field orientation="horizontal">
						<Field.Content>
							<div class="flex gap-2 items-center">
								<CircleIcon
									class={[
										'size-3! fill-current/50',
										data.url.active ? 'text-success' : 'text-destructive'
									]}
								/>
								<Field.Title class="leading-0">{m.status()}</Field.Title>
							</div>
							<Field.Description class="text-balance max-w-md"
								>{m.url_status_helper()}</Field.Description
							>
						</Field.Content>
						<Switch
							checked={data.url.active}
							onCheckedChange={async (c) => {
								const res = await toggleURL(c);
								if (res?.success) toast.success(res.message);
								else toast.success(res.message);
								await invalidateAll();
							}}
						/>
					</Field.Field>
				</Field.Label>
			</div>
			<div class="grid divide-x grid-cols-2 w-full">
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger class="w-full">
							<div class="p-4 flex grow">
								<NumberCard
									item={{
										helper:
											String(data.url.originalUrl.slice(0, 25)) +
											(data.url.originalUrl.length > 25 ? '...' : ''),
										icon: data.url.secret ? ShieldCheckIcon : GlobeIcon,
										label: m.original_url(),
										number: ''
									}}
								/>
							</div>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">
							<p>{data.url.originalUrl}</p>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
				<div class="p-4 flex grow">
					<NumberCard
						item={{
							helper: m.urls_protect(),
							icon: data.url.secret ? ShieldCheckIcon : GlobeIcon,
							label: m.visibility(),
							number: data.url.secret ? m.protected() : m.public()
						}}
					/>
				</div>
			</div>
			<div class="grid divide-x grid-cols-2 w-full">
				<div class="p-4 flex grow">
					<NumberCard
						item={{
							helper: `${formatTimeAgo(data.url.createdAt, getLocale())}`,
							icon: MousePointerClickIcon,
							label: m.visits(),
							number: data.url.hit
						}}
					/>
				</div>
				<div class="p-4 flex grow">
					<NumberCard
						item={{
							helper: m.limits(),
							icon: BrickWallShieldIcon,
							label: '',
							number: data.url.limit > -1 ? data.url.limit : m.not_set()
						}}
					/>
				</div>
			</div>
			<div class="grid grid-cols-1 @lg:grid-cols-2 @lg:divide-x @lg:divide-y-0 divide-y w-full">
				<div class="p-4 flex">
					<NumberCard
						item={{
							helper: m.created_at(),
							icon: ClockIcon,
							label: '',
							number: data.url.createdAt.toLocaleDateString(getLocale(), {
								dateStyle: 'medium'
							})
						}}
					/>
				</div>
				<div class="p-4 flex">
					<NumberCard
						item={{
							helper: m.expiration(),
							icon: AlarmClockIcon,
							label: '',
							number:
								data.url.expiresAt?.toLocaleDateString(getLocale(), {
									dateStyle: 'medium'
								}) ?? m.not_set()
						}}
					/>
				</div>
			</div>
			<div class="flex grow w-full flex-col overflow-y-auto overscroll-clip">
				<Tabs.Root value="tags" class="w-full divide-y grow gap-0">
					<div class="p-4 sticky flex flex-col overflow-clip top-0 bg-background">
						<Tabs.List class="grow @xl:min-w-xs w-full">
							<Tabs.Trigger value="tags">{m.tags()}</Tabs.Trigger>
							<Tabs.Trigger value="utms">{m.utm()}</Tabs.Trigger>
						</Tabs.List>
					</div>
					<div class="p-4 flex flex-col grow">
						<Item.Root class="w-full h-full content-start p-0" variant="muted">
							<Item.Content>
								<Tabs.Content value="tags" class="grow p-4">
									<div class="flex flex-wrap h-full gap-2">
										{#each data.url.tags as tag (tag.id)}
											<Badge
												class="rounded-md text-sm"
												href={resolve(`/urls/?tags=${[tag.tag].join(',')}`)}
												variant="outline">{tag.tag}</Badge
											>
										{/each}
									</div>
								</Tabs.Content>
								<Tabs.Content value="utms">
									<Table.Root>
										<Table.Header>
											<Table.Row>
												<Table.Head class="w-1/3 ps-4">{m.utm_name()}</Table.Head>
												<Table.Head class="w-1/3">{m.utm_key()}</Table.Head>
												<Table.Head class="w-1/3">{m.utm_value()}</Table.Head>
											</Table.Row>
										</Table.Header>
										<Table.Body>
											{#each Object.values(data.url.utm || {}) as utm (utm)}
												<Table.Row class="h-10">
													<Table.Cell class="ps-4">{utm.name}</Table.Cell>
													<Table.Cell>{utm.key}</Table.Cell>
													<Table.Cell>{utm.value}</Table.Cell>
												</Table.Row>
											{/each}
										</Table.Body>
									</Table.Root>
								</Tabs.Content>
							</Item.Content>
						</Item.Root>
					</div>
				</Tabs.Root>
			</div>
		</div>
	</div>
</div>

<Dialog title="QR Code" class="lg:max-w-sm" bind:open={showQRCode} description="">
	<div class="mx-auto w-full aspect-square">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html qrCode}
	</div>
	<Button
		class="w-full"
		onclick={() => {
			const qr = renderSVG(completeURL || '', {
				blackColor: 'black',
				whiteColor: 'white'
			});
			var link = document.createElement('a');
			link.setAttribute('href', 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qr));
			link.setAttribute('download', `${data.url.shortcode}.svg`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}}
		><QrCodeIcon /><span>{m.download()}</span>
	</Button>
</Dialog>

<Dialog title={m.create_one()} description={m.utm_helper()} bind:open={showUTM}>
	<form
		class="flex flex-col gap-2"
		onsubmit={(e) => {
			e.preventDefault();
			const form = new FormData(e.currentTarget);

			const utmName = form.get('utm_name')?.toString();
			const utmKey = form.get('utm_key')?.toString();
			const utmValue = form.get('utm_value')?.toString();
			if (
				utmKey &&
				utmKey?.trim() !== '' &&
				utmName &&
				utmName?.trim() !== '' &&
				utmValue &&
				utmValue?.trim() !== ''
			) {
				data.url.utm = Object.fromEntries(
					Array.from(
						new Map([
							...Object.entries(data.url.utm || {}),
							[utmKey, { key: utmKey, name: utmName, value: utmValue }]
						])
					)
				);
				showUTM = false;
				e.currentTarget.reset();
			} else toast.error(m.errors_non_empty());
		}}
	>
		<Field.Field>
			<Field.Label>{m.utm_name()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon><CaseSensitiveIcon /></InputGroup.Addon>
				<InputGroup.Input name="utm_name" placeholder={m.utm_name_placeholder()} />
			</InputGroup.Root>
			<Field.Description>{m.utm_name_helper()}</Field.Description>
		</Field.Field>
		<Field.Field>
			<Field.Label>{m.utm_key()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon><TagIcon /></InputGroup.Addon>
				<InputGroup.Input
					oninput={(e) => (e.currentTarget.value = underscore(e.currentTarget.value))}
					name="utm_key"
					placeholder={m.utm_key_placeholder()}
				/>
			</InputGroup.Root>
			<Field.Description>{m.utm_name_helper()}</Field.Description>
		</Field.Field>
		<Field.Field>
			<Field.Label>{m.utm_value()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon><HashIcon /></InputGroup.Addon>
				<InputGroup.Input
					oninput={(e) => (e.currentTarget.value = slugify(e.currentTarget.value))}
					name="utm_value"
					placeholder={m.utm_value_placeholder()}
				/>
			</InputGroup.Root>
			<Field.Description>{m.utm_value_helper()}</Field.Description>
		</Field.Field>
		<Button class="mt-2" type="submit">{m.confirm()}</Button>
	</form>
</Dialog>
