<script lang="ts">
	import { debounce } from '$lib/utils/debouce';
	import Breadcrumbs from '$lib/ui/crumbs/breadcrumbs.svelte';
	import { getLocale } from '$lib/i18n';
	import { H3, H4, Paragraph, Small } from '$lib/ui/typography';
	import LinkIcon from 'lucide-svelte/icons/link';
	import ColumnsIcon from 'lucide-svelte/icons/columns-3';
	import EmailIcon from 'lucide-svelte/icons/mail';
	import SearchIcon from 'lucide-svelte/icons/search';
	import RowsIcon from 'lucide-svelte/icons/rows-3';
	import ShieldIcon from 'lucide-svelte/icons/shield';
	import MoreIcon from 'lucide-svelte/icons/more-horizontal';
	import SortingDownIcon from 'lucide-svelte/icons/a-arrow-down';
	import SortingUpIcon from 'lucide-svelte/icons/a-arrow-up';
	import ResetIcon from 'lucide-svelte/icons/filter-x';
	import InfiniteIcon from 'lucide-svelte/icons/infinity';
	import { page } from '$app/stores';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { intlFormatDistance } from 'date-fns';
	import {
		popup,
		SlideToggle,
		type PopupSettings,
		Paginator,
		type PaginationSettings,
		getModalStore,
		type ModalSettings,
		clipboard,
		type ModalComponent
	} from '@skeletonlabs/skeleton';
	import { writable } from 'svelte/store';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from './$types.js';
	import { toast } from 'svelte-sonner';
	import CustomToast from '$lib/ui/toaster/customToast.svelte';
	import { longpress } from '$lib/utils/longpress';
	import { env } from '$env/dynamic/public';
	import QrCode from '$lib/ui/modals/qr-code.svelte';
	const { t } = getLocale();

	export let data, form;

	let active_columns = writable(data.active_columns);

	let sortable_list = ['shortcode', 'has_secret', 'created', 'used', 'max_usages', 'ttl'];

	let search: string;

	const columns: {
		id: string;
		label: string;
		classes: string;
		visible: boolean;
	}[] = [
		columnBuilder('original_url', ' max-w-28 '),
		columnBuilder('shortcode', 'min-w-28'),
		columnBuilder('has_secret', 'w-10'),
		columnBuilder('status', 'min-w-28 text-center'),
		columnBuilder('created', 'min-w-28'),
		columnBuilder('ttl', 'min-w-28'),
		columnBuilder('used', 'w-10 text-center'),
		columnBuilder('max_usages', 'w-10 text-center')
	];

	function columnBuilder(column: string, classes: string = 'text-center') {
		return {
			id: column,
			classes,
			label: $t(`snapps:columns:${column.replace('_', ':')}`),
			visible: $active_columns.includes(column)
		};
	}

	async function sort_by(this: HTMLButtonElement) {
		const sort_by = this.dataset.column;

		if (!sort_by) return;

		const url = $page.url;
		let direction = url.searchParams.get('direction');

		if (direction === 'asc') url.searchParams.set('direction', 'desc');
		else url.searchParams.set('direction', 'asc');

		if (sort_by === 'ttl') url.searchParams.set('sort', 'expiration');
		else url.searchParams.set('sort', sort_by);

		await goto(url);
		await invalidateAll();
	}

	function getRelativeDate(date: Date) {
		const rel = intlFormatDistance(date, new Date(), { locale: data.lang });
		return rel;
	}

	const columnPopup: PopupSettings = {
		event: 'click',
		target: 'columnPopup',
		placement: 'bottom-end',
		state(e) {
			if (e.state === false) {
				document.forms.namedItem('save-columns')?.requestSubmit();
			}
		}
	};
	const searchPopup: PopupSettings = {
		event: 'focus-click',
		target: 'searchPopup',
		placement: 'bottom-start',
		closeQuery: '',
		state(e) {
			setTimeout(() => {
				if (e.state === true) searchRef.focus();
			}, 50);
		}
	};
	const morePopup: PopupSettings = {
		event: 'click',
		target: 'morePopup',
		placement: 'bottom-end',
		closeQuery: '.more-icon'
	};
	const tooltipRowCount: PopupSettings = {
		event: 'hover',
		target: 'tooltipRowCount',
		placement: 'right-start'
	};

	function handle_change_columns(this: HTMLInputElement) {
		const column = this.dataset.column;
		if (!column) return;
		if ($active_columns.includes(column)) {
			active_columns.set($active_columns.filter((col) => col !== column));
		} else active_columns.set([...$active_columns, column]);
	}

	async function handle_search() {
		const url = $page.url;
		if (!search || search.trim() === '') {
			url.searchParams.delete('q');
		} else {
			url.searchParams.set('q', search);
		}

		await goto(url, {
			keepFocus: true,
			replaceState: false
		});
		await invalidateAll();
	}

	let searchRef: HTMLInputElement;
	let row_limit = data.limit;

	function handle_row_count() {
		document.forms.namedItem('save-row-count')?.requestSubmit();
	}
	const enhanceRowCountSubmit: SubmitFunction = function ({ formData }) {
		formData.set('limit', String(row_limit));
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
						message: form.message,
						state: 'error'
					}
				});
			await invalidateAll();
		};
	};

	const paginationSettings = writable({
		page: data.page - 1,
		limit: data.limit,
		size: data.count,
		amounts: []
	});

	$: paginationSettings.set({
		...$paginationSettings,
		page: data.page - 1,
		limit: data.limit,
		size: data.count
	});
	async function handle_page(event: CustomEvent & { detail?: number }) {
		const url = $page.url;
		const _page = event.detail + 1;
		url.searchParams.set('page', _page);
		await goto(url, { replaceState: true });
		await invalidateAll();
	}

	async function handle_long(this: HTMLTableCellElement) {
		const row = this.dataset.idx;
		if (row && !$active_rows.includes(row))
			$active_rows = [...Array.from(new Set([...$active_rows, row]))];
		else $active_rows = $active_rows.filter((_row) => _row !== row);
	}

	let active_rows = writable<string[]>([]);

	async function handle_reset_filters() {
		const url = $page.url;
		url.searchParams.delete('q');
		url.searchParams.delete('sort');
		url.searchParams.delete('direction');
		url.searchParams.delete('page');
		url.searchParams.delete('limit');
		await goto(url);
	}

	const enhanceSaveColumns: SubmitFunction = function ({ formData }) {
		formData.set('columns', $active_columns.join(','));
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
						message: form.message,
						state: 'error'
					}
				});
			await invalidateAll();
		};
	};

	function handle_active_id(this: HTMLInputElement) {
		const row = this.dataset.idx;
		active_id.set(data.urls.find((u) => u.id === row));
	}

	function handle_select_id(this: HTMLInputElement) {
		const row = this.value;
		if (this.dataset.selectAll && $active_rows.length < data.urls.length)
			return ($active_rows = data.urls.map((u) => u.id));
		else if (this.dataset.selectAll && $active_rows.length === data.urls.length)
			return ($active_rows = []);

		if (row && !$active_rows.includes(row))
			$active_rows = [...Array.from(new Set([...$active_rows, row]))];
		else $active_rows = $active_rows.filter((_row) => _row !== row);
	}

	const modalStore = getModalStore();

	function handle_qr_code_modal() {
		const modalQrCode: ModalComponent = {
			ref: QrCode,
			props: { url: env.PUBLIC_URL + '/' + $active_id?.shortcode }
		};

		const modal = {
			type: 'component',
			component: modalQrCode
		} satisfies ModalSettings;

		modalStore.trigger(modal);
	}
	$: modal = {
		type: 'confirm',
		// Data
		title: $t('snapps:selected:remove'),
		body: $t('snapps:selected:remove:helper', { ids_count: `${$active_rows.length}` }),
		buttonTextConfirm: $t('global:misc:confirm'),
		buttonTextCancel: $t('global:misc:cancel'),
		// TRUE if confirm pressed, FALSE if cancel pressed
		response: (r: boolean) => {
			if (r === true) document.forms.namedItem('delete-selected')?.requestSubmit();
		}
	} satisfies ModalSettings;

	const enhanceDeleteIds: SubmitFunction = function ({ formData }) {
		formData.set('ids', $active_rows.join(','));
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
						message: form.message,
						state: 'error'
					}
				});
			active_rows.set([]);
			await invalidateAll();
		};
	};

	function open_delete_modal() {
		modalStore.trigger(modal);
	}

	let active_id = writable<DBSnapp | undefined>();

	function handle_copy_toast() {
		if (env.PUBLIC_URL && env.PUBLIC_URL.startsWith('https')) {
			toast.custom(CustomToast, {
				componentProps: { message: 'snapp:clipboard:copied', state: 'surface' }
			});
		} else {
			toast.custom(CustomToast, {
				componentProps: { message: 'snapp:clipboard:error', state: 'error' }
			});
		}
	}

	function handle_delete_single() {
		if ($active_id) active_rows.set([$active_id.id]);
		setTimeout(() => modalStore.trigger(modal), 50);
	}

	function handle_resend_inviation() {
		document.forms.namedItem('resend-invite')?.requestSubmit();
	}

	const enhanceInvite: SubmitFunction = function () {
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
	><title>{$t('global:appname')} | {$t('global:pages:user', { id: data.username })}</title
	></svelte:head
>
<form action="?/resendInvitation" id="resend-invite" method="post" use:enhance={enhanceInvite} />
<form action="?/deleteIds" id="delete-selected" method="post" use:enhance={enhanceDeleteIds} />
<form action="?/saveColumns" id="save-columns" method="post" use:enhance={enhanceSaveColumns} />
<form
	id="save-row-count"
	method="post"
	use:enhance={enhanceRowCountSubmit}
	action="?/saveRowsCount"
/>
<div data-popup="searchPopup" class="z-20">
	<div class="flex gap-1">
		<label for="from" class="flex gap-1 mb-2">
			<div class="input-group input-group-divider h-8 grid-cols-[auto_1fr_auto]">
				<div class="flex items-center h-8 w-8" style:padding="0" style:justify-content="center">
					<SearchIcon class="w-4 h-4" />
				</div>
				<input
					class="input h-8 text-sm"
					id="from"
					bind:this={searchRef}
					type="text"
					name="from"
					placeholder={$t('global:misc:search:snapps')}
					bind:value={search}
					on:input={debounce(handle_search, 1000)}
				/>
			</div>
		</label>
	</div>
</div>
<div data-popup="morePopup" class="z-20">
	<div class="card flex flex-col p-1">
		<button
			class="btn variant-glass more-icon"
			use:clipboard={`${env.PUBLIC_URL}/${$active_id?.shortcode}`}
			on:click={handle_copy_toast}>{$t('snapps:more:copy')}</button
		>
		<a href="/dashboard/edit/{$active_id?.id}" class="btn variant-glass more-icon"
			>{$t('snapps:more:edit')}</a
		>
		<button class="btn variant-glass more-icon" on:click={handle_qr_code_modal}
			>{$t('snapps:more:qrcode')}</button
		>
		<button class="btn variant-glass more-icon" on:click={handle_delete_single}
			>{$t('snapps:more:delete')}</button
		>
	</div>
</div>
<div data-popup="columnPopup" class="z-20">
	<div class="card relative gap-x-6 grid grid-cols-2 p-4">
		<span
			class=" absolute left-[50%] top-0 bottom-0 h-full w-[1px] flex bg-surface-200-700-token flex-grow-1"
		></span>
		{#each columns as column}
			<label for="column-{column.id}" class="flex justify-between gap-4 items-center">
				<Small class="font-semibold">
					{column.label}
				</Small>
				<div class="flex items-center justify-end scale-[.8]">
					<SlideToggle
						size="sm"
						data-column={column.id}
						id="enable-limits"
						name="enable_limitts"
						background="bg-surface-300-600-token"
						active="bg-success-300-600-token"
						bind:checked={column.visible}
						on:change={handle_change_columns}
					/>
				</div>
			</label>
		{/each}
	</div>
</div>

<div class="page">
	<div class="flex justify-between">
		<div class="flex flex-col gap-4">
			<Breadcrumbs
				urls={[
					{ label: $t('global:pages:dashboard'), href: '/dashboard' },
					{ label: $t('global:pages:users'), href: '/dashboard/users' },
					{ label: $t('global:pages:user', { id: data.username }) }
				]}
			/>
			<div class="flex gap-2 items-center">
				<LinkIcon class="w-6 h-6" />
				<H3 class="mb-1 w-max">
					[ {data.username} ] :
					{$t('global:sections:snapps')}
				</H3>
			</div>
		</div>
		<button class="btn variant-glass my-auto flex items-center" on:click={handle_resend_inviation}>
			<EmailIcon class="w-4 h-4" />
			<Small class="font-semibold pb-0.5">
				{$t('emails:invited:resend')}
			</Small>
		</button>
	</div>
	<div class="card w-full">
		<div class="card-header flex items-center justify-between h-14 py-0">
			<H4>{$t('snapps:urls:list')}</H4>
		</div>
		<div class="card-body flex items-center justify-between h-14 px-4">
			<div class="flex gap-4">
				<button
					class="btn variant-outline-secondary hover:variant-ghost-secondary px-2 flex"
					use:popup={searchPopup}
				>
					<SearchIcon class="w-4 h-4" />
					<Small>
						{$t('global:misc:search')}
					</Small>
				</button>
				{#if data.sort}
					<button
						class="btn variant-outline-secondary hover:variant-ghost-secondary px-2 flex"
						on:click={handle_reset_filters}
					>
						<ResetIcon class="w-4 h-4" />
						<Small>
							{$t('snapps:reset:sort')}
						</Small>
					</button>
				{/if}
			</div>
			<div class="flex gap-4">
				{#if $active_rows.length > 0}
					<button
						class="btn variant-outline-error hover:variant-ghost-error px-2 flex"
						on:click={open_delete_modal}
					>
						<ColumnsIcon class="w-4 h-4" />
						<Small>
							{$t('snapps:selected:remove')}
						</Small>
					</button>
				{/if}
				<button
					class="btn variant-outline-secondary hover:variant-ghost-secondary px-2 flex"
					use:popup={columnPopup}
				>
					<ColumnsIcon class="w-4 h-4" />
					<Small>
						{$t('snapps:select:columns')}
					</Small>
				</button>
			</div>
		</div>
		<div class="card-body flex flex-col p-[1px] pt-0 rounded-none">
			<!-- Responsive Container (recommended) -->
			<div class="table-container rounded-none">
				<!-- Native Table Element -->
				<table class="table table-hover variant-glass rounded-none">
					<thead class="align-middle max-h-12 overflow-hidden">
						<tr>
							<th style:padding-inline=".75rem" style:padding-block="0">
								<input
									type="checkbox"
									class="checkbox variant-outline-secondary active:variant-glass"
									on:change={handle_select_id}
									checked={data.urls.length === $active_rows.length}
									data-select-all={true}
									style:margin-bottom=".125rem"
								/>
							</th>
							{#each columns as column, idx}
								{#if $active_columns.includes(column.id)}
									<th style:padding-inline=".5rem" class={column.classes} style:padding-block="0">
										{#if sortable_list.includes(column.id)}
											<button
												class="p-2 inline-flex items-center gap-1"
												data-column={column.id}
												on:click={sort_by}
											>
												<Paragraph class="font-semibold leading-none table-header">
													{column.label}
												</Paragraph>
												{#if data.sort === column.id}
													<div class="badge variant-outline-surface">
														{#if $page.url.searchParams.get('direction') === 'asc'}
															<SortingUpIcon class="w-4 h-4" />
														{/if}
														{#if $page.url.searchParams.get('direction') === 'desc'}
															<SortingDownIcon class="w-4 h-4" />
														{/if}
													</div>
												{/if}
											</button>
										{:else}
											<button
												class="p-2 inline-flex justify-center items-center text-center cursor-default"
											>
												<Paragraph class="font-semibold  leading-none table-header">
													{column.label}
												</Paragraph>
											</button>
										{/if}
									</th>
								{/if}
							{/each}
							<th class="w-full"></th>
						</tr>
					</thead>
					<tbody>
						{#each data.urls as row, i}
							<tr
								class:active-row={$active_rows.includes(row.id)}
								data-idx={row.id}
								use:longpress
								on:long={handle_long}
								on:contextmenu|preventDefault={handle_long}
							>
								<td>
									<input
										type="checkbox"
										class="checkbox variant-outline active:variant-glass"
										checked={$active_rows.includes(row.id)}
										value={row.id}
										on:change={handle_select_id}
									/>
								</td>
								{#if $active_columns.includes('original_url')}<td
										class="cursor-default w-10"
										title={row.original_url}
									>
										<Small class="whitespace-nowrap text-ellipsis overflow-hidden max-w-24 flex">
											{row.original_url}
										</Small>
									</td>{/if}
								{#if $active_columns.includes('shortcode')}<td>
										<a href="/{row.shortcode}" class="link" data-sveltekit-preload-data={false}>
											{row.shortcode}
										</a>
									</td>{/if}
								{#if $active_columns.includes('has_secret')}<td>
										{#if row.has_secret}
											<div class="text-center flex justify-center">
												<ShieldIcon class="w-4 h-4" fill="currentColor" />
											</div>
										{/if}
									</td>{/if}
								{#if $active_columns.includes('status')}
									<td class="text-center"
										><div
											class="badge variant-glass-{row.status === 'active'
												? 'success'
												: row.status === 'blacklisted'
													? 'error'
													: 'surface'}"
										>
											<Small class="font-semibold">
												{$t('snapps:status:' + row.status).toLocaleLowerCase()}
											</Small>
										</div>
									</td>{/if}
								{#if $active_columns.includes('created')}<td class="whitespace-nowrap">
										<Small>
											{getRelativeDate(row.created)}
										</Small>
									</td>
								{/if}
								{#if $active_columns.includes('ttl')}<td class="whitespace-nowrap"
										>{#if row.ttl === -1}
											<div class="badge variant-glass-surface">
												{$t('global:misc:unset')}
											</div>
										{:else if row.ttl !== -1}
											<Small>
												{getRelativeDate(new Date(new Date().getTime() + row.ttl * 1000))}
											</Small>{/if}</td
									>{/if}
								{#if $active_columns.includes('used')}<td class="text-center">{row.used}</td>{/if}
								{#if $active_columns.includes('max_usages')}<td class="text-center">
										{#if row.max_usages}{row.max_usages}{:else}<InfiniteIcon
												class="w-4 h-4 mx-auto"
											/>{/if}
									</td>{/if}
								<td>
									<button
										class="ms-auto btn h-8 w-8 p-0 flex place-items-center variant-outline-primary"
										class:variant-glass-secondary={$active_rows.includes(row.id)}
										use:popup={morePopup}
										data-idx={row.id}
										on:click={handle_active_id}
									>
										<MoreIcon class="w-4 h-4" />
									</button>
								</td>
							</tr>
						{/each}
						{#each { length: data.limit - data.urls.length } as _row, _index}
							<tr>
								{#each $active_columns as __}
									<td></td>
								{/each}
								<td></td>
								<td></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			<div class="card-footer p-3 px-4 flex justify-between">
				<label for="row-limit" class="flex flex-col gap-1">
					<div class="flex w-20 h-8 rounded-token">
						<div
							class="flex items-center p-0 px-4 w-10 flex-shrink-0 border-t border-b border-r-none border-l border-secondary-500 rounded-tl-token rounded-bl-token rounded-tr-none rounded-br-none"
							style:padding="0"
							style:justify-content="center"
						>
							<RowsIcon class=" w-4 h-4" />
						</div>
						<input
							class="input h-8 w-12 text-sm border-primary-400-500-token border-solid border-l-none flex-grow-0 flex-shrink-1 rounded-bl-none rounded-tl-none"
							use:popup={tooltipRowCount}
							id="row-limit"
							type="text"
							style:min-width="unset !important"
							name="row-limit"
							on:input={debounce(handle_row_count, 1000)}
							bind:value={row_limit}
						/>
					</div>
				</label>
				<Paginator
					bind:settings={$paginationSettings}
					on:page={handle_page}
					showFirstLastButtons={false}
					showPreviousNextButtons={true}
				/>
			</div>
		</div>
	</div>
</div>

<div data-popup="tooltipRowCount">
	<div class="flex card p-2 z-20">
		<Small>
			{$t('settings:app:user:limits:max:rows:label')}
		</Small>
	</div>
</div>

<style lang="postcss">
	:global(.input-group-divider > input) {
		min-width: unset !important;
	}

	.active-row,
	.active-row:hover {
		@apply bg-secondary-400/50;
	}
	.table tbody tr.active-row:nth-child(2n),
	.table tbody tr.active-row:nth-child(2n):hover {
		@apply bg-secondary-300/50;
	}

	.more-icon {
		@apply justify-start rounded-none text-[0.625rem] font-bold uppercase variant-glass;
	}
	.more-icon:hover {
		@apply variant-ghost-primary;
	}
</style>
