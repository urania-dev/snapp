<script lang="ts">
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import Card from '$lib/ui/card.svelte';
	import { cn } from '$lib/utils/cn';
	import Icon from '$lib/ui/icon.svelte';
	import Input from '$lib/ui/input.svelte';
	import Switch from '$lib/ui/switch.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { intlFormatDistance } from 'date-fns';
	import { _ } from 'svelte-i18n';
	import QRCode from 'qrcode';

	import type { MouseEventHandler } from 'svelte/elements';
	import { fade, fly } from 'svelte/transition';
	import Chart from '$lib/ui/chart.svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { outside } from '$lib/utils/outside.js';

	let { data, form } = $props();
	let active = $state(!data.snapp.disabled);

	const handle_disable: MouseEventHandler<HTMLElement> = (e) => {
		e.stopPropagation();
		e.preventDefault();
		active = !active;
		document.forms.namedItem('disable-snapp')?.requestSubmit();
	};

	const enhanceAction: SubmitFunction = ({ formData }) => {
		formData.set('disabled', String(!active));

		return async function ({ result }) {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
		};
	};

	function getRelativeDate(date: Date) {
		const rel = intlFormatDistance(date, new Date(), { locale: data.lang });
		return rel;
	}

	let show_tab = $state<'details' | 'notes'>('details');

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
	let secure_context = $derived(browser && navigator.clipboard && $page.url.protocol === 'https:');

	const handle_copy_snapp_to_clipboard: MouseEventHandler<HTMLButtonElement> = async function (e) {
		e.stopPropagation();
		e.preventDefault();
		const idx = e.currentTarget.dataset.idx;
		if (!secure_context) {
			toast.error($_('tokens.not-allowed-to-copy'));
			return;
		}

		if (idx && navigator.clipboard) await navigator.clipboard.writeText(fullUrlToSnapp);
		toast.info($_('snapps.helpers.copied-to-clipboard'));
	};

	let show_zoomed_qrcode = $state(false);
	let handle_show_zoomed_qrcode: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.preventDefault();
		e.stopPropagation();
		show_zoomed_qrcode = !show_zoomed_qrcode;
	};

	let fullUrlToSnapp = $derived($page.url.origin + '/' + data.snapp.shortcode);

	let can_share = $derived(browser === true && window?.navigator?.share);
</script>

<form action="?/disable" id="disable-snapp" hidden method="post" use:enhance={enhanceAction}></form>

{#if show_zoomed_qrcode === true}
	<div id="zoomed" class="fixed inset-0 z-[100] flex flex-col bg-neutral-950/50" transition:fade>
		<div
			use:outside={() => {
				show_zoomed_qrcode = false;
			}}
			class="z-30 m-auto flex rounded w-full max-w-sm flex-col gap-4 overflow-y-scroll text-balance border border-slate-500/50 bg-neutral-50 p-4 leading-relaxed text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
			transition:fly={{ y: 25 }}
		>
			{#await QRCode.toDataURL(fullUrlToSnapp, { width: 350, margin: 2 })}
				<Icon ph="spinner" />
			{:then generated}
				<div class="flex gap-4 flex-col">
					<Card css={{ card: 'p-2' }}>
						<img
							src={generated}
							class="w-full h-full aspect-square"
							alt="QRCode: {data.snapp.shortcode}"
						/>
					</Card>
					<Card css={{ card: 'items-center text-balance w-full leading-relaxed gap-4 p-2' }}>
						<div class="flex flex-col md:flex-row w-full h-full gap-4">
							<div class="flex w-full h-full gap-2 flex-col items-center justify-center">
								<span class="w-full text-sm font-bold">QR Code</span>
								<div class="flex gap-4 flex-col justify-center w-full">
									<button
										onclick={async () => {
											const a = document.createElement('a');
											a.href = await QRCode.toDataURL(fullUrlToSnapp, {
												width: 800,
												margin: 4
											});
											a.title = 'QRCode: [' + data.snapp.shortcode + ']';
											a.download = 'qrcode-' + data.snapp.shortcode + '.png';
											a.click();
										}}
										class="flex h-10 flex-row w-full items-center gap-2 rounded border-none bg-slate-500/25 p-0 px-4 text-start font-semibold outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8"
										><Icon ph="download" />
										<small class="text-sm">{$_('globals.download')}</small></button
									>
									{#if can_share}
										<button
											onclick={async () => {
												const filename = data.snapp.shortcode + '.png';
												const dataUri = await QRCode.toDataURL(fullUrlToSnapp);
												function dataUriToBlob(dataURI: string, dataTYPE: string) {
													var binary = atob(dataURI.split(',')[1]),
														array = [];
													for (var i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
													return new Blob([new Uint8Array(array)], { type: dataTYPE });
												}

												const _data = {
													files: [
														new File([dataUriToBlob(dataUri, 'image/png')], filename, {
															type: 'image/png'
														})
													],
													title: filename,
													text: fullUrlToSnapp
												};
												try {
													if (!navigator.canShare(_data)) return;

													await navigator.share(_data);
												} catch (err) {
													console.log(err);
												}
											}}
											class="flex h-10 flex-row w-full max-w-none items-center gap-2 rounded border-none bg-slate-500/25 p-0 px-4 text-start font-semibold outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8"
											><Icon ph="share-network" />
											<small class="text-sm">{$_('globals.share')}</small></button
										>{/if}
								</div>
							</div>
						</div>
					</Card>
				</div>
			{/await}
		</div>
	</div>
{/if}
<svelte:head>
	<title>{$_('appname')} | {data.username} | {data.snapp.shortcode}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
<div class={cn('flex w-full flex-col p-4 pb-8', show_tab === 'notes' ? 'h-full' : '')}>
	<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
		<a class="flex gap-2 font-semibold uppercase tracking-wider" href="/users/{data.username}"
			><Icon ph="arrow-left" /><small class="text-sm">{$_('globals.back')}</small></a
		>
		<div class="flex w-full flex-col justify-between gap-4 lg:flex-row lg:items-center">
			<h2 class="flex w-full items-center gap-2 text-lg font-bold">
				<Icon ph="link-simple" size={36} />
				<span>
					{data.snapp.shortcode}
				</span>
			</h2>
			<div class="flex w-full flex-col gap-4 lg:max-w-max lg:flex-row">
				{#if secure_context}
					<button
						data-idx={data.snapp.shortcode}
						onclick={handle_copy_snapp_to_clipboard}
						class="flex h-10 flex-row items-center justify-between gap-2 rounded border-none bg-slate-500/25 p-0 px-4 text-start font-semibold outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8"
					>
						<small class="text-sm">{$_('globals.copy')}</small>
						<Icon ph="copy"></Icon>
					</button>
				{/if}
				<Card css={{ card: 'lg:h-8 h-10 items-center lg:max-w-max gap-4 p-0 px-2' }}>
					<a
						class="flex w-full items-center justify-between gap-4 p-2 px-2 hover:text-pink-500 lg:p-1"
						href="/{data.snapp.shortcode}"
						target="_blank"
						data-sveltekit-preload-data={false}
					>
						<small class="pt-0.5 text-sm font-medium">
							{$_('snapps.labels.open-link')}
						</small>
						<Icon ph="arrow-square-out"></Icon>
					</a>
				</Card>
			</div>
		</div>
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
		<Card css={{ card: 'flex-row p-2' }}>
			<button
				onclick={() => (show_tab = 'details')}
				class={cn(
					'flex h-10 w-full max-w-max items-center gap-2 rounded p-2 text-sm leading-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8',
					show_tab === 'details' ? 'bg-slate-500/50' : 'bg-slate-500/25 '
				)}>{$_('snapps.labels.details')}</button
			>
			<button
				onclick={() => (show_tab = 'notes')}
				class={cn(
					'flex h-10 w-full max-w-max items-center gap-2 rounded p-2 text-sm leading-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8',
					show_tab === 'notes' ? 'bg-slate-500/50' : 'bg-slate-500/25 '
				)}>{$_('snapps.fields.notes')}</button
			>
			<button
				class={cn(
					'flex h-10 w-full max-w-max items-center gap-2 rounded p-2 text-sm bg-slate-500/25 leading-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8'
				)}
				onclick={handle_show_zoomed_qrcode}>QR Code</button
			>
			<a
				href="/users/{data.username}/{data.snapp.id}/edit"
				class={cn(
					'flex h-10 w-full max-w-max items-center gap-2 rounded p-2 text-sm leading-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8',
					show_tab === 'notes' ? 'bg-slate-500/50' : 'bg-slate-500/25 '
				)}
				>{$_('snapps.labels.edit')}
			</a>
		</Card>
		{#if show_tab === 'details'}
			<div class="flex w-full" in:fly={{ y: 25 }}>
				<Card css={{ card: 'gap-4' }}>
					<div class="flex w-full flex-col gap-4 lg:flex-row">
						<Card css={{ card: 'items-center text-balance w-full leading-relaxed gap-4 p-2' }}>
							<Switch
								name="status"
								label="{$_('snapps.fields.status')}: {active === true
									? $_('globals.active')
									: $_('globals.disabled')}"
								helper={$_('snapps.helpers.disable-text-1')}
								actions={{ toggle: handle_disable }}
								bind:value={active}
							></Switch>
							<small class="w-full">{$_('snapps.helpers.disable-text-2')}</small>
						</Card>
						<div class="flex w-full flex-col gap-4">
							<Card css={{ card: 'p-2 gap-4 w-full' }}>
								<Input
									icons={{ left: 'globe' }}
									name="original_url"
									disabled
									label={$_('snapps.fields.original-url')}
									bind:value={data.snapp.original_url}
								/>
							</Card>
							<Card css={{ card: 'p-2 gap-4' }}>
								<Input
									icons={{ left: 'link-simple-horizontal' }}
									name="shortcode"
									disabled
									label={$_('snapps.fields.shortcode')}
									bind:value={data.snapp.shortcode}
								/>
							</Card>
						</div>
					</div>
					<div class="flex w-full flex-col gap-4 lg:flex-row">
						<Card
							css={{ card: 'items-center text-balance w-fullleading-relaxed gap-4 p-2 h-full' }}
						>
							<Input
								icons={{ left: 'lock-laminated' }}
								css={{ 'icon-left': data.snapp.secret === null ? 'opacity-25' : 'opacity-100' }}
								name="secret"
								disabled
								label={$_('snapps.fields.secret')}
								value={data.snapp.secret === null
									? $_('snapps.helpers.not-secret')
									: $_('snapps.helpers.secret')}
							/>
						</Card>
						<Card css={{ card: 'p-2 gap-4 flex-row w-full lg:max-w-[calc(50%_-_.75rem)]' }}>
							<Input
								name="hit"
								disabled
								label={$_('snapps.fields.hit')}
								css={{ input: 'capitalize' }}
								value={data.snapp.hit}
							/>

							<Input
								name="used"
								disabled
								label={$_('snapps.fields.used')}
								css={{
									input: cn(
										'capitalize',
										data.snapp.max_usages > 0
											? ''
											: 'text-xxs tracking-wider text-center opacity-50 uppercase font-semibold'
									)
								}}
								value={data.snapp.max_usages && data.snapp.max_usages > 0
									? data.snapp.used
									: $_('snapps.helpers.not-max-usages')}
							/>
							<Input
								name="max-usages"
								disabled
								label={$_('snapps.fields.max-usages')}
								css={{
									input: cn(
										'capitalize',
										data.snapp.max_usages > 0
											? ''
											: 'text-xxs tracking-wider text-center opacity-50 uppercase font-semibold'
									)
								}}
								value={data.snapp.max_usages > 0
									? data.snapp.max_usages
									: $_('snapps.helpers.not-max-usages')}
							/>
						</Card>
					</div>
					<div class="flex w-full flex-col gap-4 lg:flex-row">
						<Card css={{ card: 'p-2 gap-4' }}>
							<Input
								icons={{ left: 'clock' }}
								name="created"
								disabled
								label={$_('snapps.fields.created')}
								css={{ input: 'capitalize' }}
								value={getRelativeDate(data.snapp.created)}
							/>
						</Card>
						<Card css={{ card: 'p-2 gap-4 flex-row w-full lg:max-w-[calc(50%_-_.75rem)]' }}>
							<Input
								icons={{ left: 'alarm' }}
								name="expiration"
								disabled
								label={$_('snapps.fields.expiration')}
								css={{
									input: cn(
										'capitalize',
										data.snapp.expiration === null
											? 'opacity-50 text-xxs text-center font-semibold uppercase tracking-wider'
											: ''
									)
								}}
								value={data.snapp.expiration
									? getRelativeDate(data.snapp.expiration)
									: $_('globals.disabled')}
							/>
						</Card>
					</div>
				</Card>
			</div>
		{/if}
		{#if show_tab === 'notes'}
			<div class="flex h-full w-full" in:fly={{ y: 25 }}>
				<Card css={{ card: 'flex-row h-full' }}>
					<Input
						label={$_('snapps.fields.notes')}
						type="textarea"
						name="notes"
						css={{ field: 'h-full', input: 'text-balance' }}
						disabled
						value={data.snapp.notes}
					/>
				</Card>
			</div>
		{/if}
	</div>
</div>
