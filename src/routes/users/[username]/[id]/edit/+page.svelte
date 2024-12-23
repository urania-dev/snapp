<script lang="ts">
	import { toast } from 'svelte-sonner';
	import Card from '$lib/ui/card.svelte';
	import Input from '$lib/ui/input.svelte';
	import Switch from '$lib/ui/switch.svelte';
	import { slugify } from '$lib/utils/slug';
	import { _ } from 'svelte-i18n';
	import type { MouseEventHandler } from 'svelte/elements';
	import type { SubmitFunction } from './$types.js';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { fly } from 'svelte/transition';
	import Select from '$lib/ui/select.svelte';
	import { intlFormatDistance } from 'date-fns';
	import Icon from '$lib/ui/icon.svelte';
	import { cn } from '$lib/utils/cn.js';

	let { data, form } = $props();

	let _snapp = $state(data.snapp);
	onMount(async () => {
		if (!browser) return;
		window.addEventListener('paste', handle_paste);
	});

	onDestroy(() => {
		if (!browser) return;
		window.removeEventListener('paste', handle_paste);
	});

	const handle_paste = function handle_paste(e: ClipboardEvent) {
		const original_url = e.clipboardData?.getData('text/plain');
		if (original_url && !data.allow_http && !original_url.toLowerCase().startsWith('https://'))
			return toast.info($_('errors.snapps.unallowed-not-https'));
		else if (original_url) _snapp.original_url = original_url;
		toast.info($_('snapps.helpers.text-pasted'));
	};

	let has_secret = $state<boolean>(data.snapp.secret !== null);
	let has_expiration = $state<boolean>(data.snapp.expiration !== null);
	let has_limited_usage = $state<boolean>(data.snapp.max_usages > 0);

	let exp_units = $state<'seconds' | 'hours' | 'minutes' | 'days' | 'weeks' | 'months' | 'years'>(
		'hours'
	);

	let exp_time = $state<number>(0);
	let exp_label = $state($_('snapps.time.hours'));
	let time_units = [
		{
			id: 'seconds',
			value: $_('snapps.time.seconds')
		},
		{
			id: 'minutes',
			value: $_('snapps.time.minutes')
		},
		{
			id: 'hours',
			value: $_('snapps.time.hours')
		},
		{
			id: 'days',
			value: $_('snapps.time.days')
		},
		{
			id: 'weeks',
			value: $_('snapps.time.weeks')
		},
		{
			id: 'months',
			value: $_('snapps.time.months')
		},
		{
			id: 'years',
			value: $_('snapps.time.years')
		}
	];

	function getRelativeDate(date: Date) {
		const rel = intlFormatDistance(date, new Date(), { locale: data.lang });
		return rel;
	}

	const get_expiration = (time: number, units: typeof exp_units = 'seconds') => {
		let exp = 0;
		switch (units) {
			default:
			case 'seconds':
				exp = time;
				break;
			case 'minutes':
				exp = time * 60;
				break;
			case 'hours':
				exp = time * 60 * 60;
				break;
			case 'days':
				exp = time * 60 * 60 * 24;
				break;
			case 'weeks':
				exp = time * 60 * 60 * 24 * 7;
				break;
			case 'months':
				exp = time * 60 * 60 * 24 * 7 * 4;
				break;
			case 'years':
				exp = time * 60 * 60 * 24 * 365;
				break;
		}
		return exp;
	};
	let ttl = $derived(
		has_expiration === true && exp_time > 0 && exp_units
			? get_expiration(exp_time, exp_units)
			: null
	);

	const handle_save: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.stopPropagation();
		const idx = e.currentTarget.dataset.idx;
		if (idx) document.forms.namedItem(idx)?.requestSubmit();
	};

	const enhanceSnappAction: SubmitFunction = ({ formData, cancel }) => {
		if (ttl) _snapp.expiration = new Date(new Date().getTime() + ttl * 1000);
		if (_snapp) formData.set('snapp', JSON.stringify(_snapp));
		else return cancel();
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
		};
	};

	let reset_password = $state(false);
	let reset_expiration = $state(false);

	// const close_and_reset_panel = () => {
	// 	reset_expiration = false;
	// 	reset_password = false;
	// 	has_secret = false;
	// 	has_expiration = false;
	// 	has_limited_usage = false;
	// 	_snapp = data.snapp;
	// };

	let show_secret = $state(false);
</script>

<form id="create" hidden use:enhance={enhanceSnappAction} method="post"></form>

<div class={cn('flex w-full flex-col p-4 pb-8')}>
	<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
		<a
			class="flex gap-2 font-semibold uppercase tracking-wider"
			href="/users/{data.username}/{_snapp.id}"
			><Icon ph="arrow-left" /><small class="text-sm">{$_('globals.back')}</small></a
		>
		<h4 class="text-lg font-bold leading-relaxed tracking-wide">
			{$_(`snapps.labels.edit`)}
		</h4>
		<Card css={{ card: 'gap-4' }}>
			<Card css={{ card: 'p-4 items-start gap-4' }}>
				<div class="flex w-full flex-col gap-2">
					<Input
						icons={{ left: 'globe', right: 'clipboard' }}
						name="original-url"
						actions={{
							right: async () => {
								const pasted = await window.navigator.clipboard.readText();
								if (pasted && !data.allow_http && !pasted.toLowerCase().startsWith('https://'))
									return toast.info($_('errors.snapps.unallowed-not-https'));
								else _snapp.original_url = pasted;
								toast.info($_('snapps.helpers.text-pasted'));
							}
						}}
						label={$_('snapps.fields.original-url')}
						placeholder={$_('snapps.placeholders.original-url')}
						bind:value={_snapp.original_url}
					/>
					{#if !data.allow_http}
						<small class="px-1">{@html $_('snapps.helpers.original-url')}</small>
					{/if}
				</div>
			</Card>
			<Card css={{ card: 'p-4 items-start gap-4' }}>
				<div class="flex w-full flex-col gap-2">
					<Input
						icons={{ left: 'link-simple-horizontal' }}
						name="shortcode"
						actions={{
							input: () => {
								_snapp.shortcode = slugify(_snapp.shortcode);
							}
						}}
						label={$_('snapps.fields.shortcode')}
						placeholder={$_('snapps.placeholders.shortcode')}
						bind:value={_snapp.shortcode}
					/>
					{#if !data.allow_http}
						<small class="px-1">{@html $_('snapps.helpers.shortcode')}</small>
					{/if}
				</div>
			</Card>
			<Card css={{ card: 'text-balance leading-relaxed p-4 ' }}>
				<Switch
					name="switch-secret"
					bind:value={has_secret}
					label={$_('snapps.fields.has-secret')}
					helper={$_('snapps.helpers.has-secret')}
					idx="has_secret"
					actions={{
						toggle: () => {
							has_secret = !has_secret;
							if (has_secret && _snapp.secret === null) reset_password = true;
						}
					}}
				></Switch>
			</Card>

			{#if has_secret && !reset_password}
				<div transition:fly={{ y: 25 }} class="w-full">
					<Card css={{ card: 'p-4 items-start gap-2 ' }}>
						<small>{$_('snapps.helpers.previous-secret')}</small>
						<button
							class="flex h-10 w-full items-center justify-center gap-2 rounded border-none bg-slate-500/25 px-4 text-sm outline-none transition-all hover:bg-red-500/50 focus:bg-red-500/50"
							onclick={() => {
								reset_password = true;
								_snapp.secret = null;
							}}>{$_('snapps.helpers.remove-secret')}</button
						>
					</Card>
				</div>
			{/if}
			{#if has_secret && reset_password}
				<div transition:fly={{ y: 25, delay: 501 }} class="w-full">
					<Card css={{ card: 'p-4 items-start gap-4' }}>
						<div class="flex w-full flex-col gap-2">
							<Input
								icons={{ left: 'key', right: show_secret ? 'eye' : 'eye-closed' }}
								actions={{
									right: (e) => {
										e.preventDefault();
										e.stopPropagation();
										show_secret = !show_secret;
									}
								}}
								type={show_secret ? 'text' : 'password'}
								name="secret"
								label={$_('snapps.fields.secret')}
								placeholder={$_('snapps.placeholders.secret')}
								bind:value={_snapp.secret}
							/>
						</div>
					</Card>
				</div>
			{/if}
			<Card css={{ card: 'text-balance leading-relaxed p-4 ' }}>
				<Switch
					bind:value={has_expiration}
					label={$_('snapps.fields.has-expiration')}
					helper={$_('snapps.helpers.expiration')}
					idx="has_expiration"
					name="switch-expiration"
					actions={{
						toggle: () => {
							has_expiration = !has_expiration;
							if (has_expiration && _snapp.expiration === null) reset_expiration = true;
							if (!has_expiration) _snapp.expiration = null;
						}
					}}
				></Switch>
			</Card>
			{#if has_expiration && reset_expiration === true}
				<div class="flex w-full" transition:fly={{ y: 25 }}>
					<Card css={{ card: 'p-4 items-start flex-row gap-2' }}>
						<Input
							icons={{ left: 'clock' }}
							name="exp-time"
							bind:value={exp_time}
							type="number"
							label={$_('snapps.fields.expiration')}
						/>
						<Select
							label="&nbsp;"
							name="exp-units"
							actions={{
								select: (e) => {
									const idx = e.currentTarget.dataset.idx;
									if (!idx) return;
									exp_units = idx as typeof exp_units;
									exp_label = $_('snapps.time.' + exp_units);
								}
							}}
							items={time_units}
							bind:value={exp_label}
						></Select>
					</Card>
				</div>
			{/if}
			{#if has_expiration && !reset_expiration}
				<div class="w-full" transition:fly={{ y: 25 }}>
					<Card css={{ card: 'p-4 items-start gap-2' }}>
						<small
							>{@html $_('snapps.helpers.previous-expiration', {
								values: { relativeTime: getRelativeDate(_snapp.expiration as Date) }
							})}</small
						>
						<button
							class="flex h-10 w-full items-center justify-center gap-2 rounded border-none bg-slate-500/25 px-4 text-sm outline-none transition-all hover:bg-red-500/50 focus:bg-red-500/50"
							onclick={() => {
								_snapp.expiration = null;
								has_expiration = false;
								reset_expiration = true;
							}}>{$_('snapps.helpers.remove-expiration')}</button
						>
					</Card>
				</div>
			{/if}
			<Card css={{ card: 'text-balance leading-relaxed p-4 ' }}>
				<Switch
					bind:value={has_limited_usage}
					label={$_('snapps.fields.has-limited-usage')}
					helper={$_('snapps.helpers.max-usages')}
					idx="has_limited_usage"
					name="switch-max-usages"
					actions={{
						toggle: (e) => {
							e.stopPropagation();
							has_limited_usage = !has_limited_usage;
							if (!has_limited_usage) _snapp.max_usages = -1;
							if (has_limited_usage && _snapp.max_usages === -1) _snapp.max_usages = 0;
						}
					}}
				></Switch>
			</Card>
			{#if has_limited_usage}
				<div class="w-full" transition:fly={{ y: 25 }}>
					<Card css={{ card: 'p-4 items-start flex-row gap-2' }}>
						<Input
							icons={{ left: 'clock' }}
							name="max-usages"
							bind:value={_snapp.max_usages}
							type="number"
							label={$_('snapps.fields.max-usages')}
						/>
					</Card>
				</div>
			{/if}

			<Card css={{ card: 'flex-row min-h-52 p-4' }}>
				<Input
					name="notes"
					type="textarea"
					css={{ field: 'h-full' }}
					label={$_('snapps.fields.notes')}
					bind:value={_snapp.notes}
				/>
			</Card>
			<div class="mt-auto flex w-full gap-4">
				<a
					href="/users/{data.username}/{_snapp.id}"
					class="flex h-10 w-full items-center justify-center gap-2 rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
					><Icon ph="arrow-left"></Icon>
					<small class="text-sm font-semibold">
						{$_('globals.close')}
					</small>
				</a>
				<button
					data-idx="create"
					onclick={handle_save}
					class="flex h-10 w-full items-center justify-center gap-2 rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-green-500/50 focus:bg-green-500/50"
					><Icon ph="floppy-disk" size={16} /><small class="text-sm font-semibold">
						{$_('globals.save')}
					</small>
				</button>
			</div>
		</Card>
	</div>
</div>
