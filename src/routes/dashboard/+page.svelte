<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Switch from '$lib/ui/switch.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import Input from '$lib/ui/input.svelte';
	import { outside } from '$lib/utils/outside';
	import { _ } from 'svelte-i18n';
	import { fade, fly } from 'svelte/transition';
	import { onDestroy, onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { toast } from '$lib/svelte-sonner';
	import Select from '$lib/ui/select.svelte';
	import type { MouseEventHandler } from 'svelte/elements';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types.js';
	import { intlFormatDistance } from 'date-fns';
	import { invalidateAll } from '$app/navigation';
	import { debounce } from '$lib/utils/debounce';
	import { cn } from '$lib/utils/cn.js';
	import { slugify } from '$lib/utils/slug.js';
	import { queryParam } from 'sveltekit-search-params';
	import { page } from '$app/stores';
	let { data, form } = $props();
	let snapp_action = $state<'create' | 'edit' | 'delete' | 'delete-all'>();

	let show_snapp_panel = $state(false);
	let show_secret = $state(false);
	let show_column_panel = $state(false);
	let show_confirm_panel = $state(false);

	const snapp_initial_value = {
		id: '',
		shortcode: '',
		original_url: '',
		notes: null,
		secret: null,
		max_usages: undefined,
		expiration: null
	};
	let _snapp = $state<Partial<Snapp>>(snapp_initial_value);
	onMount(async () => {
		if (!browser) return;
		if (data.limit !== limitValue) limitValue = data.limit;
		window.addEventListener('paste', handle_paste);
	});

	onDestroy(() => {
		if (!browser) return;
		window.removeEventListener('paste', handle_paste);
	});

	const handle_paste = function handle_paste(e: ClipboardEvent) {
		const original_url = e.clipboardData?.getData('text/plain');
		if (original_url && !data.allow_http && !original_url.startsWith('https://'))
			return toast.info($_('errors.snapps.unallowed-not-https'));
		else if (show_snapp_panel && document.activeElement?.id !== 'original-url') {
			_snapp.original_url = original_url;
			toast.info($_('snapps.helpers.text-pasted'));
		}
	};

	let has_secret = $state<boolean>(false);
	let has_expiration = $state<boolean>(false);
	let has_limited_usage = $state<boolean>(false);

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

	const enhanceDeleteAction: SubmitFunction = ({ formData, cancel }) => {
		if (!selected.length) return cancel();
		formData.set('ids', JSON.stringify(selected));
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
			if (form?.success === true) close_and_reset_panel();
		};
	};
	const enhanceSnappAction: SubmitFunction = ({ formData }) => {
		
		if (ttl) _snapp.expiration = new Date(new Date().getTime() + ttl * 1000);
		if (_snapp) formData.set('snapp', JSON.stringify(_snapp));
		if (creationTags.length) formData.set('tags', JSON.stringify(creationTags));
		
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
			if (form?.success === true) close_and_reset_panel();
		};
	};

	function getRelativeDate(date: Date) {
		const rel = intlFormatDistance(date, new Date(), { locale: data.lang });
		return rel;
	}

	let innerWidth = $state<number>(0);
	let reset_password = $state(false);
	let reset_expiration = $state(false);

	const close_and_reset_panel = () => {
		show_confirm_panel = false;
		show_snapp_panel = false;
		reset_expiration = false;
		reset_password = false;
		has_secret = false;
		has_expiration = false;
		has_limited_usage = false;
		_snapp = snapp_initial_value;
		selected = [];
	};

	const open_edit_panel: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.stopPropagation();
		e.preventDefault();
		snapp_action = 'edit';
		const idx = e.currentTarget.dataset.idx;
		if (!idx) return;
		const snapp = data.snapps.find((s) => s.id === idx);
		if (!snapp) return;
		_snapp = snapp;
		creationTags = snapp.tags.map((t) => t.id);

		has_secret = snapp.secret === null ? false : true;
		has_expiration = snapp.expiration !== null ? true : false;
		has_limited_usage = (snapp.max_usages && snapp.max_usages > 0) || false;
		show_snapp_panel = true;
	};

	const tagQuery = queryParam('tag-query');
	const query = queryParam('query');
	const limit = queryParam('limit', {
		defaultValue: data.limit as number | undefined,
		decode: (val: string | null) => (val ? parseInt(val) : null),
		encode: (val: number) => val.toString()
	});

	const orderBy = queryParam('order-by', {
		encode: (str: string) => str as string,
		decode: (str: string | null) => str as string | null,
		defaultValue: undefined as string | undefined
	});

	const ascending = queryParam('ascending', {
		defaultValue: undefined as boolean | undefined,
		encode: (booleanValue) => booleanValue.toString(),
		decode: (stringValue) => stringValue !== null && stringValue !== 'false'
	});

	const pageParam = queryParam('page', {
		defaultValue: 1,
		encode: (number) => number.toString(),
		decode: (stringedNumber) => (stringedNumber && parseInt(stringedNumber)) || null
	});

	const max_pages = $derived(Math.ceil(data.count / ($limit || data.limit)));
	const default_columns = [
		'original_url',
		'shortcode',
		'secret',
		'status',
		'created',
		'expiration',
		'hit',
		'max_usages'
	];
	let columns = $state(data.cols.length ? data.cols : default_columns);

	const handle_select_column: MouseEventHandler<HTMLButtonElement> = (e) => {
		const column = e.currentTarget.dataset.idx;
		if (!column) return;
		if (columns.includes(column)) columns = columns.filter((c) => c !== column);
		else columns.push(column);
		debounce(() => {
			show_column_panel = false;
			document.forms.namedItem('save-columns')?.requestSubmit();
		}, 2500)();
	};

	const enhanceRows: SubmitFunction = ({ formData }) => {
		formData.set('rows', limitValue.toString());
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
			$limit = limitValue;
		};
	};

	const enhanceSaveColumn: SubmitFunction = ({ formData }) => {
		formData.set('columns', JSON.stringify(columns));
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
		};
	};

	let secure_context = $derived(browser && navigator.clipboard && $page.url.protocol === 'https:');

	const handle_copy_snapp_to_clipboard: MouseEventHandler<HTMLButtonElement> = async function (e) {
		e.stopPropagation();
		e.preventDefault();
		const idx = e.currentTarget.dataset.idx;
		const prefix = e.currentTarget.dataset.prefix;
		if (!secure_context) {
			toast.error($_('tokens.not-allowed-to-copy'));
			return;
		}

		const withPrefix = $page.url.origin + '/' + (data.tagsAsPrefix ? prefix + '/' + idx : idx);
		if (idx && navigator.clipboard) await navigator.clipboard.writeText(withPrefix);
		toast.info($_('snapps.helpers.copied-to-clipboard'));
	};
	let limitValue = $state<number>(data.limit);
	let original_url_field = $state<HTMLInputElement>();

	let selected = $state<string[]>([]);

	const handle_select_this: MouseEventHandler<HTMLButtonElement> = (e) => {
		const idx = e.currentTarget.dataset.idx;
		if (!idx) return;
		if (idx === 'all') {
			if (selected.length === data.snapps.length) {
				selected.splice(0, selected.length);
			} else {
				selected = [];
				for (let snapp of data.snapps) {
					selected.push(snapp.id);
				}
			}
		} else if (selected.includes(idx)) {
			const index = selected.findIndex((i) => i === idx);
			selected.splice(index, 1);
		} else selected.push(idx);
	};

	let tagToAdd = $state<string>();
	let tagAction = $state<string>();

	let creationTags = $state<string[]>([]);

	const handle_tag: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.preventDefault();
		e.stopPropagation();
		const idx = e.currentTarget.dataset.idx;
		const action = e.currentTarget.dataset.action;
		if (idx) {
			tagToAdd = idx;
			tagAction = action;
			if (tagAction === 'connect') {
				if (data.tagsAsPrefix === true) creationTags = [];
				creationTags.push(tagToAdd);
			}
			if (tagAction === 'disconnect') {
				creationTags = creationTags.filter((t) => t !== tagToAdd);
			}
		}
	};

</script>

<svelte:window bind:innerWidth />

<svelte:head>
	<title>{$_('appname')} | {$_('menu.dashboard')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
<form
	action="?/save-cols"
	id="save-columns"
	hidden
	use:enhance={enhanceSaveColumn}
	method="post"
></form>
<form
	action="?/delete-all"
	id="delete-all"
	hidden
	use:enhance={enhanceDeleteAction}
	method="post"
></form>
<form action="?/delete" id="delete" hidden use:enhance={enhanceSnappAction} method="post"></form>
<form action="?/create" id="create" hidden use:enhance={enhanceSnappAction} method="post"></form>
<form action="?/edit" id="edit" hidden use:enhance={enhanceSnappAction} method="post"></form>

{#if show_column_panel === true}
	<div
		class="fixed inset-0 z-50 grid h-screen w-screen grid-cols-1 place-content-center bg-neutral-950/50"
		transition:fade
	>
		<div
			use:outside={() => {
				show_column_panel = false;
			}}
			class="mx-auto flex w-full max-w-sm shrink-0 flex-col rounded border border-slate-500/50 bg-neutral-50 p-2 dark:bg-neutral-950"
			transition:fly={{ y: 25 }}
		>
			<h4 class="py-2 font-semibold">{$_('snapps.labels.columns')}</h4>
			<div class="grid w-full grid-cols-2 gap-2 pb-2">
				{#each default_columns as column}
					<button data-idx={column} class="flex items-center gap-2" onclick={handle_select_column}>
						<div
							class="flex h-6 w-6 items-center justify-center rounded border border-slate-500/50 bg-neutral-50 dark:bg-neutral-950"
						>
							{#if columns.includes(column)}
								<Icon ph="check" size={16}></Icon>
							{/if}
						</div>
						<small class="font-semibold">
							{$_('snapps.fields.' + column.replaceAll('_', '-'))}
						</small>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
<div class="flex h-full w-full flex-col overflow-hidden p-4">
	<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
		<div class="flex h-8 items-center gap-2">
			<Icon ph="squares-four" size={36} />
			<h2 class="text-2xl font-bold">
				{$_('menu.dashboard')}
			</h2>
		</div>
		<div class="flex w-full" style:height={innerWidth < 1024 ? 'calc(100% - 3rem)' : 'h-full'}>
			<Card css={{ card: 'h-full gap-4' }}>
				<div class="flex  flex-col w-full items-center gap-4">
					<Card css={{ card: 'md:flex-row justify-between gap-4 p-2' }}>
						<h4 class="whitespace-nowrap ps-2 text-lg font-semibold">{$_('snapps.label')}</h4>
						{#if !selected.length}
							<button
								in:fade
								onclick={(e) => {
									e.stopPropagation();
									show_snapp_panel = true;
									snapp_action = 'create';
								}}
								class="flex h-12 w-full items-center gap-2 rounded border border-slate-500/50 p-0 px-4 text-sm font-semibold transition-all hover:bg-slate-500 hover:text-neutral-50 md:h-8 md:w-max md:justify-center lg:px-2"
							>
								<Icon ph="plus" />
								<small class="text-sm ps-3 leading-none md:p-0">{$_('snapps.labels.create')}</small>
							</button>{:else}
							<button
								in:fade
								onclick={(e) => {
									e.stopPropagation();
									show_confirm_panel = true;
									snapp_action = 'delete-all';
								}}
								class="flex h-12 w-full items-center gap-2 rounded border border-red-500/50 p-0 px-4 text-sm font-semibold transition-all hover:bg-red-500/25 hover:text-neutral-50 md:h-8 md:w-max md:justify-center lg:px-2"
							>
								<Icon ph="trash" />
								<small class="text-sm ps-3 leading-none md:p-0">{$_('globals.delete')}</small>
							</button>
						{/if}
					</Card>
				</div>
				<Card
					css={{
						card: 'p-2 h-full items-start w-full overflow-clip overflow-x-scroll overflow-y-scroll'
					}}
				>
					{#if data.snapps.length}
						<table class="w-full table-auto text-sm">
							<thead>
								<tr class="table-row h-10">
									<th class="px-2 table-cell" style:width="1.5rem">
										<button
											class="flex h-5 w-5 items-center justify-center rounded border border-slate-500/50 bg-neutral-50 dark:bg-neutral-950"
											onclick={handle_select_this}
											data-idx="all"
										>
											{#if selected.length === data.snapps.length}
												<Icon ph="check" size={14} />
											{:else if selected.length === 0}
												&nbsp;
											{:else}
												<Icon ph="circle" size={4} style="fill" />
											{/if}
										</button>
									</th>
									{#if columns.includes('original_url')}
										<th class="table-cell px-2">
											<button
												class="flex h-full w-full items-center justify-start gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'original_url') $ascending = $ascending ? false : true;
													else {
														$orderBy = 'original_url';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.original-url')}</span>
												{#if $orderBy === 'original_url'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('shortcode')}
										<th class="table-cell px-2">
											<button
												class="flex h-full w-full items-center justify-start gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'shortcode')
														$ascending = $ascending === true ? false : true;
													else {
														$orderBy = 'shortcode';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.shortcode')}</span>
												{#if $orderBy === 'shortcode'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('secret')}
										<th class="table-cell px-2">
											<button
												class="flex h-full w-full items-center justify-center gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'secret') $ascending = $ascending ? false : true;
													else {
														$orderBy = 'secret';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.secret')}</span>
												{#if $orderBy === 'secret'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('status')}
										<th class="table-cell w-max px-2">
											<button
												class="flex h-full w-full items-center justify-center gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'disabled') $ascending = $ascending ? false : true;
													else {
														$orderBy = 'disabled';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.status')}</span>
												{#if $orderBy === 'disabled'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('created')}
										<th class="table-cell w-32 px-2">
											<button
												class="flex h-full w-full items-center justify-start gap-2 whitespace-nowrap text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'created') $ascending = $ascending ? false : true;
													else {
														$orderBy = 'created';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.created')}</span>
												{#if $orderBy === 'created'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('expiration')}
										<th class="table-cell w-32 px-2">
											<button
												class="flex h-full w-full items-center justify-start gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'expiration') $ascending = $ascending ? false : true;
													else {
														$orderBy = 'expiration';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.expiration')}</span>
												{#if $orderBy === 'expiration'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('hit')}
										<th class="table-cell w-10 px-2">
											<button
												class="flex h-full w-full items-center justify-center gap-2 text-xxs uppercase tracking-wider"
												onclick={() => {
													if ($orderBy === 'hit') $ascending = $ascending ? false : true;
													else {
														$orderBy = 'hit';
														$ascending = false;
													}
												}}
											>
												<span>{$_('snapps.fields.hit')}</span>
												{#if $orderBy === 'hit'}
													<Icon
														css={{ icon: 'h-max w-max' }}
														ph={$ascending === true ? 'sort-ascending' : 'sort-descending'}
													/>
												{/if}
											</button>
										</th>
									{/if}
									{#if columns.includes('max_usages')}
										<th class="table-cell w-10 px-2">
											<div
												class="flex h-full w-full items-center justify-center gap-2 whitespace-nowrap text-xxs uppercase tracking-wider"
											>
												<span>{$_('snapps.fields.max-usages')}</span>
											</div>
										</th>
									{/if}
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each data.snapps as snapp, idx}
									<tr
										class="h-14 w-full border border-slate-500/25 bg-slate-500/5 p-4 transition-all hover:bg-slate-500/15 md:h-12"
									>
										<th class="px-2 table-cell" style:width="1.5rem">
											<button
												class="flex h-5 w-5 items-center justify-center rounded border border-slate-500/50 bg-neutral-50 dark:bg-neutral-950"
												onclick={handle_select_this}
												data-idx={snapp.id}
											>
												{#if selected.includes(snapp.id)}
													<Icon ph="check" size={14} />
												{:else}
													&nbsp;
												{/if}
											</button>
										</th>
										{#if columns.includes('original_url')}
											<td
												class="table-cell w-52 max-w-52 overflow-hidden text-ellipsis whitespace-nowrap px-2 align-middle"
											>
												{snapp.original_url}
											</td>
										{/if}
										{#if columns.includes('shortcode')}
											<td class="table-cell whitespace-nowrap px-2 align-middle">
												<a class="link" href="/dashboard/{snapp.id}">
													{snapp.shortcode}
												</a>
											</td>
										{/if}
										{#if columns.includes('secret')}
											<td class="table-cell w-10 whitespace-nowrap px-2 text-center align-middle">
												<div class="flex h-10 w-10 items-center justify-center">
													<Icon
														ph="lock-laminated"
														css={{
															icon: cn(
																'w-max h-max',
																snapp.secret !== null ? 'opacity-100' : 'opacity-25'
															)
														}}
													></Icon>
												</div>
											</td>
										{/if}
										{#if columns.includes('status')}
											<td class="table-cell w-24 whitespace-nowrap px-2 text-center align-middle">
												<span class="text-xxs font-bold uppercase tracking-wider">
													{snapp.disabled !== true ? $_('globals.active') : $_('globals.disabled')}
												</span>
											</td>
										{/if}
										{#if columns.includes('created')}
											<td
												class="table-cell whitespace-nowrap px-2 align-middle text-xxs font-bold uppercase tracking-wider"
											>
												{getRelativeDate(snapp.created)}
											</td>
										{/if}
										{#if columns.includes('expiration')}
											<td class="table-cell whitespace-nowrap px-2 align-middle">
												<div class="flex h-full w-full items-center gap-2">
													<span
														class={cn(
															'pt-0.5 text-xxs font-bold uppercase tracking-wider ',
															snapp.expiration !== null ? 'opacity-100' : 'opacity-25'
														)}
													>
														{snapp.expiration !== null
															? getRelativeDate(snapp.expiration)
															: $_('globals.disabled')}
													</span>
												</div>
											</td>
										{/if}
										{#if columns.includes('hit')}
											<td class="table-cell w-max whitespace-nowrap px-2 text-center align-middle">
												{snapp.hit}
											</td>
										{/if}
										{#if columns.includes('max_usages')}
											<td class="table-cell whitespace-nowrap px-2 text-center align-middle">
												<div class="flex h-full items-center justify-center">
													{#if snapp.max_usages > 0}
														{snapp.max_usages}
													{:else}
														<Icon ph="infinity"></Icon>
													{/if}
												</div>
											</td>
										{/if}

										<td class=" table-cell w-40 whitespace-nowrap px-2 text-end align-middle">
											<div class="flex w-full max-w-40 justify-end gap-2">
												<button
													data-idx={snapp.id}
													onclick={(e) => {
														_snapp.id = undefined;
														e.stopPropagation();
														_snapp.id = snapp.id;
														snapp_action = 'delete';
														show_confirm_panel = true;
													}}
													in:fly|global={{ delay: 75, y: 24 }}
													class="flex h-10 w-10 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-red-500/50 focus:bg-red-500/50 md:h-8 md:w-8"
													><Icon ph="trash"></Icon>
												</button>

												<button
													data-idx={snapp.id}
													onclick={open_edit_panel}
													in:fly|global={{ delay: 75 * 2, y: 24 }}
													class="flex h-10 w-10 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
													><Icon ph="pencil"></Icon>
												</button>
												<a
													href="/dashboard/{snapp.id}"
													in:fly|global={{ delay: 75 * 3, y: 24 }}
													class="flex h-10 w-10 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
													><Icon ph="eye"></Icon>
												</a>
												{#if secure_context}
													<button
														data-prefix={snapp.tags?.[0]?.slug}
														data-idx={snapp.shortcode}
														onclick={handle_copy_snapp_to_clipboard}
														in:fly|global={{ delay: 75 * 4, y: 24 }}
														class="flex h-10 w-10 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
														><Icon ph="copy"></Icon>
													</button>
												{/if}
											</div>
										</td>
									</tr>
								{/each}
								{#each { length: data.limit - data.snapps.length } as _, idx}
									<tr
										class="h-14 w-full border border-slate-500/25 bg-slate-500/5 p-4 transition-all hover:bg-slate-500/15 md:h-10"
									>
										{#key columns.length}
											<td class="table-cell whitespace-nowrap px-2 text-center align-middle"
												>&nbsp;</td
											>
											{#each { length: columns.length + 1 } as _, idx}
												<td class="table-cell whitespace-nowrap px-2 text-center align-middle"
													>&nbsp;</td
												>
											{/each}
										{/key}
									</tr>
								{/each}
							</tbody>
						</table>
					{:else}
						<div class="flex h-full w-full shrink-0 flex-col items-center justify-center">
							<div class="flex rounded-full bg-slate-500/25 p-10">
								<Icon css={{ icon: 'text-pink-500/50' }} ph="magnifying-glass" size={128}></Icon>
							</div>
						</div>
					{/if}
				</Card>
				<div class="mt-auto flex w-full flex-col gap-2 md:flex-row">
					<Card css={{ card: 'w-full p-2 h-full md:flex-row justify-between' }}>
						<div class="flex w-full gap-2">
							<form
								method="post"
								action="?/save-rows"
								use:enhance={enhanceRows}
								id="save-rows"
								hidden
							></form>
							<Input
								name="limit"
								icons={{ left: 'rows' }}
								actions={{
									change: (e) => {
										document.forms.namedItem('save-rows')?.requestSubmit();
									},
									input: (e) => {
										debounce(() => document.forms.namedItem('save-rows')?.requestSubmit(), 1000)();
									}
								}}
								css={{
									field: 'max-h-12 md:max-h-8 p-0 flex-row max-w-max',
									input: 'text-sm max-h-12 md:max-h-8 w-full text-center',
									group: 'max-h-12 min-h-12 md:max-h-8 md:min-h-8 w-20',
									label: 'hidden'
								}}
								bind:value={limitValue}
							/>
							<Input
								name="search"
								placeholder={$_('snapps.placeholders.search')}
								css={{
									field: 'max-h-12 md:max-h-8 p-0 flex-row md:max-w-[19rem]',
									input: 'text-sm max-h-12 md:max-h-8',
									group: 'max-h-12 min-h-12 md:max-h-8 md:min-h-8',
									label: 'hidden'
								}}
								icons={{ left: 'magnifying-glass' }}
								bind:value={$query}
							/>
							<button
								onclick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									show_column_panel = !show_column_panel;
								}}
								class="flex h-12 w-12 items-center justify-center gap-2 rounded border border-slate-500/50 px-4 text-sm outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-auto"
							>
								<Icon ph="gear" css={{ icon: 'w-max h-max' }} />
								<span class="hidden text-sm font-semibold md:flex"
									>{$_('snapps.labels.columns')}</span
								>
							</button>
						</div>
						<div
							class="flex w-full items-center justify-start gap-2 p-0 font-semibold md:justify-end"
						>
							<button
								onclick={() => ($pageParam = Math.max(1, ($pageParam || 1) - 1))}
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
							>
								<Icon ph="arrow-left" />
							</button>

							<button
								onclick={() => {
									if ($pageParam && max_pages === Number($pageParam))
										toast.info($_('globals.max-page-reached'));
									$pageParam = Math.min(max_pages, Number($pageParam) + 1);
								}}
								class="flex h-12 w-12 shrink-0 items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
							>
								<Icon ph="arrow-right" />
							</button>
							<div
								class="flex w-full items-center justify-end gap-2 p-0 font-semibold md:max-w-max"
							>
								<small>
									{$_('snapps.labels.count')}
								</small>
								<small>:</small><small
									class="flex aspect-square h-8 min-w-8 shrink-0 items-center justify-center rounded bg-slate-500/15 p-2"
									>{data.count}</small
								>
							</div>
						</div>
					</Card>
				</div>
			</Card>
		</div>
	</div>
</div>

{#if show_snapp_panel === true}
	<div class="fixed inset-0 z-[29] bg-neutral-950/50" transition:fade></div>
	<div
		use:outside={close_and_reset_panel}
		class="fixed bottom-0 right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col gap-4 overflow-y-scroll border-l border-slate-500/50 bg-neutral-50 p-4 text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
		transition:fly={{ x: '100%' }}
	>
		<h4 class="text-lg font-bold leading-relaxed tracking-wide">
			{$_(`snapps.labels.${snapp_action}`)}
		</h4>
		<Card css={{ card: 'p-2 items-start gap-4' }}>
			<div class="flex w-full flex-col gap-2">
				<Input
					bind:element={original_url_field}
					icons={{ left: 'globe', right: 'clipboard' }}
					name="original-url"
					actions={{
						right: async () => {
							const pasted = await window.navigator.clipboard.readText();
							if (pasted && !data.allow_http && !pasted.startsWith('https://'))
								return toast.info($_('errors.snapps.unallowed-not-https'));
							else if (show_snapp_panel === true) _snapp.original_url = pasted;
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
		<Card css={{ card: 'p-2 items-start gap-4' }}>
			<div class="flex w-full flex-col gap-2">
				<Input
					icons={{ left: 'link-simple-horizontal' }}
					name="shortcode"
					actions={{
						input: (e) => {
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
		<Card css={{ card: 'text-balance leading-relaxed p-2 px-3' }}>
			<Switch
				name="switch-secret"
				bind:value={has_secret}
				label={$_('snapps.fields.has-secret')}
				helper={$_('snapps.helpers.has-secret')}
				idx="has_secret"
				actions={{
					toggle: (e) => {
						has_secret = !has_secret;
						if (has_secret && _snapp.secret === null) reset_password = true;
					}
				}}
			></Switch>
		</Card>
		{#if has_secret && snapp_action === 'create'}
			<div transition:fly={{ y: 25 }}>
				<Card css={{ card: 'p-2 items-start gap-4' }}>
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
		{#if has_secret && !reset_password && snapp_action === 'edit'}
			<div transition:fly={{ y: 25 }}>
				<Card css={{ card: 'p-2 items-start gap-2 ' }}>
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
		{#if has_secret && reset_password && snapp_action === 'edit'}
			<div transition:fly={{ y: 25, delay: 501 }}>
				<Card css={{ card: 'p-2 items-start gap-4' }}>
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
		<Card css={{ card: 'text-balance leading-relaxed p-2 px-3' }}>
			<Switch
				bind:value={has_expiration}
				label={$_('snapps.fields.has-expiration')}
				helper={$_('snapps.helpers.expiration')}
				idx="has_expiration"
				name="switch-expiration"
				actions={{
					toggle: (e) => {
						has_expiration = !has_expiration;
						if (has_expiration && _snapp.expiration === null) reset_expiration = true;
						if (!has_expiration) _snapp.expiration = null;
					}
				}}
			></Switch>
		</Card>
		{#if has_expiration && snapp_action === 'create'}
			<div transition:fly={{ y: 25 }}>
				<Card css={{ card: 'p-2 items-start flex-row gap-2' }}>
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
		{#if has_expiration && snapp_action === 'edit' && reset_expiration === true}
			<div transition:fly={{ y: 25 }}>
				<Card css={{ card: 'p-2 items-start flex-row gap-2' }}>
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
		{#if has_expiration && !reset_expiration && snapp_action === 'edit'}
			<div transition:fly={{ y: 25 }}>
				<Card css={{ card: 'p-2 items-start gap-2' }}>
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
		<Card css={{ card: 'text-balance leading-relaxed p-2 px-3' }}>
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
			<div transition:fly={{ y: 25 }}>
				<Card css={{ card: 'p-2 items-start flex-row gap-2' }}>
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
		<div class="flex h-full grow w-full" in:fly={{ y: 25 }}>
			<div class="flex h-full flex-col w-full gap-4 overflow-y-scroll">
				<Card css={{ card: 'p-2 gap-2 flex h-full' }}>
					<span class="px-1 text-left text-sm font-semibold tracking-wider w-full"
						>{$_('menu.tags')}</span
					>
					<div class="flex w-full gap-2">
						<Input
							name="search"
							placeholder={$_('tags.placeholders.search')}
							css={{
								field: 'max-h-10 p-0 flex-row ',
								input: 'text-sm max-h-10',
								group: 'max-h-10 min-h-10',
								label: 'hidden'
							}}
							icons={{ left: 'magnifying-glass' }}
							bind:value={$tagQuery}
						/>
					</div>
					{#each data.tags as tag}
						<Card css={{ card: 'h-10 p-0 items-center flex-row' }}>
							<button
								data-action={creationTags.includes(tag.id) ? 'disconnect' : 'connect'}
								data-idx={tag.id}
								class="flex items-center leading-none w-full gap-2 p-2 h-max"
								onclick={handle_tag}
							>
								<div class="flex gap-2 items-center w-full">
									{#if creationTags.includes(tag.id)}
										<Icon ph="tag-simple" style="fill" />
									{:else}
										<Icon ph="tag-simple" />
									{/if}
									<small class="text-sm leading-none">{tag.name}</small>
								</div>
							</button>
						</Card>
					{/each}
					{#each { length: Math.max(0, 3 - data.tags.length) } as tag}
						<Card css={{ card: 'h-10 p-0 px-4 items-center flex-row' }}></Card>
					{/each}
				</Card>
			</div>
		</div>
		<Card css={{ card: 'flex-row min-h-52 p-2' }}>
			<Input
				name="notes"
				type="textarea"
				css={{ field: 'h-full' }}
				label={$_('snapps.fields.notes')}
				bind:value={_snapp.notes}
			/>
		</Card>
		<div class="mt-auto flex w-full gap-4">
			<button
				onclick={close_and_reset_panel}
				class="flex h-10 w-full items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
				><small class="pt-0.5 font-semibold">
					{$_('globals.close')}
				</small>
			</button>
			<button
				data-idx={snapp_action}
				onclick={handle_save}
				class="flex h-10 w-full items-center justify-center gap-2 rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-green-500/50 focus:bg-green-500/50"
				><Icon ph="floppy-disk" size={16} /><small class="pt-0.5 font-semibold">
					{$_('globals.save')}
				</small>
			</button>
		</div>
	</div>
{/if}

{#if show_confirm_panel}
	<div class="fixed inset-0 z-[29] flex flex-col bg-neutral-950/50" transition:fade>
		<div
			use:outside={() => {
				show_confirm_panel = false;
			}}
			class="z-30 m-auto flex rounded w-full max-w-sm flex-col gap-4 overflow-y-scroll text-balance border border-slate-500/50 bg-neutral-50 p-4 leading-relaxed text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
			transition:fly={{ y: 25 }}
		>
			<h4>{$_('globals.sure-ask')}</h4>
			<p>{$_('snapps.actions.confirm-delete')}</p>
			<div class="flex w-full gap-4">
				<button
					onclick={() => {
						show_confirm_panel = false;
					}}
					class="flex h-8 w-full items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
					><small class="pt-0.5 font-semibold">
						{$_('globals.cancel')}
					</small>
				</button>
				<button
					data-idx={snapp_action}
					onclick={handle_save}
					class="flex h-8 w-full items-center justify-center gap-2 rounded border-none bg-red-500/25 outline-none transition-all hover:bg-red-500/50 focus:bg-red-500/50"
					><Icon ph="trash" size={16} /><small class="pt-0.5 font-semibold">
						{$_('globals.confirm')}
					</small>
				</button>
			</div>
		</div>
	</div>
{/if}
