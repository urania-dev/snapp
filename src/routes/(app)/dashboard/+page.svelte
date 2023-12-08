<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, invalidate } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { PUBLIC_URL } from '$env/static/public';
	import { debounce } from '$lib/utils/debounce.js';
	import type { Snapp } from '@prisma/client';
	import type { Toast } from 'bootstrap';
	import qrcode from 'qrcode';
	let { data } = $props();
	let { snapps } = $derived(data);

	let toastRef = $state<HTMLElement>();
	let toast = $state<Toast>();
	let selected = $state<string[]>([]);
	let max_entries = $state(data.max_entries ?? 8);
	let selected_length = $derived<boolean>(selected.length === snapps.length && snapps.length > 0);
	let starting_columns: Columns[] = (data.dashboard_columns as Columns[] | undefined) ?? [
		// 'original-url',
		'short-code',
		'created-at',
		'expires-at',
		'status',
		'usages'
	];
	let selected_columns = $state<Columns[]>(starting_columns);
	let actual_columns = $state<Columns[]>(starting_columns);
	let sortDir = $derived(data.sortDir);
	let qrCode = $state<Snapp>();

	function handle_select_all() {
		if (!selected_length) selected = snapps.map((url) => url.id);
		else selected = [];
	}
	function handle_selected(this: HTMLInputElement) {
		const idx = this.dataset.idx;
		if (!idx) return;
		if (selected.includes(idx)) selected = selected.filter((id) => id !== idx);
		else selected = [...selected, idx];
	}

	function handle_selected_column(this: HTMLInputElement) {
		const column = this.dataset.column as Columns | null;
		if (!column) return;
		if (selected_columns.includes(column))
			selected_columns = selected_columns.filter((c) => c !== column);
		else selected_columns = [...selected_columns, column];
	}

	async function handle_change_column() {
		actual_columns = selected_columns;
		document.forms.namedItem('save-columns-preference')?.requestSubmit();
	}

	async function handle_pagination(this: HTMLButtonElement) {
		const page = this.dataset.page;
		if (!page) return;
		const url = new URL(data.url);
		url.searchParams.set('page', page);
		await goto(url, { invalidateAll: true });
		await invalidate('u:list');
	}
	async function handle_sorting(this: HTMLButtonElement) {
		const column = this.dataset.column;

		const url = new URL(data.url);

		if (column) {
			url.searchParams.set('sortBy', column);
			url.searchParams.set('dir', sortDir && sortDir === 'desc' ? 'asc' : 'desc');
		} else {
			url.searchParams.delete('sortBy');
			url.searchParams.delete('dir');
		}
		await goto(url, { invalidateAll: true });
		await invalidate('u:list');
	}

	async function handle_change_number_of_rows() {
		if (max_entries < 1) max_entries = 1;

		const url = new URL(data.url);
		url.searchParams.set('limit', String(max_entries));
		await goto(url, { invalidateAll: true });
		await invalidate('u:list');
		document.forms.namedItem('save-max-entries-preference')?.requestSubmit();
	}

	async function initializeToast() {
		if (!toastRef) return;
		const Toaster = (await import('bootstrap/js/dist/toast.js')).default;
		toast = new Toaster(toastRef);
	}

	async function handle_copy_shortcode(this: HTMLButtonElement) {
		const short_code = this.parentElement?.dataset.short_code;
		if (!short_code) return;
		const copiedUrl = `${env.PUBLIC_URL}/~/${short_code}`;
		await navigator.clipboard.writeText(copiedUrl);

		toast?.show();
	}

	function handle_delete_shortcode(this: HTMLButtonElement) {
		const idx = this.parentElement?.dataset.idx;
		if (!idx) return;
		selected = [idx];
	}

	function mountPage() {
		initializeToast();
	}

	function handle_delete_selected(this: HTMLButtonElement) {
		document.forms.namedItem('delete-snapps')?.requestSubmit();
	}

	function handle_show_qrcode(this: HTMLButtonElement) {
		const id = this.dataset.idx;
		if (!id) return;
		const snapp = data.snapps.find((s) => s.id === id);
		if (snapp) qrCode = snapp;
	}

	async function handle_generate_qrcode() {
		const darkMode = data._theme === 'dark';

		if (qrCode === undefined)
			return {
				qrCodeImage: null,
				error: 'Not found'
			};
		else {
			const object = await qrcode.toDataURL(`${PUBLIC_URL}/~/${qrCode.short_code}`, {
				color: {
					dark: darkMode ? '#206bc4' : '#000000',
					light: darkMode ? '#1a2335' : '#ffffff'
				},
				width: 500,
				type: 'image/png'
			});
			if (object)
				return {
					qrCodeImage: object,
					error: null
				};
			else
				return {
					qrCodeImage: null,
					error: 'Error during QR Code generation'
				};
		}
	}

	async function handle_download_qrcode() {
		if (!qrCode) return;
		const object = await qrcode.toDataURL(`${PUBLIC_URL}/~/${qrCode.short_code}`, {
			width: 500,
			type: 'image/png'
		});

		const downloadLink = document.createElement('a');
		downloadLink.href = object;
		downloadLink.download = `${qrCode.short_code}.png`;
		downloadLink.click();
		downloadLink.remove();
	}
	async function handle_search(this: HTMLInputElement) {
		const query = this.value;
		const url = new URL(data.url);
		if (query.trim() !== '') {
			url.searchParams.set('query', query);
		} else {
			url.searchParams.delete('query');
		}
		await goto(url, { invalidateAll: true });
		await invalidate('u:list');
	}

	$effect(mountPage);
</script>

<svelte:head>
	<title>Dashboard | Snapp.li</title>
</svelte:head>

<form
	hidden
	method="post"
	id="save-max-entries-preference"
	action="?/save-max-entries-preference"
	use:enhance
>
	<input name="max-entries" type="number" bind:value={max_entries} />
</form>
<form
	hidden
	method="post"
	id="save-columns-preference"
	action="?/save-columns-preference"
	use:enhance
>
	<input name="columns" type="text" bind:value={selected_columns} />
</form>

<form
	hidden
	method="post"
	id="delete-snapps"
	action="?/delete-snapps"
	use:enhance={function ({ formData }) {
		formData.set('ids', selected.join(','));
	}}
/>

<div
	class="modal fade"
	id="column-modal"
	tabindex="-1"
	aria-labelledby="column-modal-label"
	aria-hidden="true"
>
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="column-modal-label">Select the columns</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body row w-100 m-0">
				<label class="form-check col-6">
					<input
						class="form-check-input"
						type="checkbox"
						data-column="original-url"
						on:change={handle_selected_column}
						checked={selected_columns.includes('original-url')}
					/>
					<span class="form-check-label">Original url</span>
				</label>
				<label class="form-check col-6">
					<input
						class="form-check-input"
						type="checkbox"
						data-column="short-code"
						on:change={handle_selected_column}
						checked={selected_columns.includes('short-code')}
					/>
					<span class="form-check-label">Short code</span>
				</label>
				<label class="form-check col-6">
					<input
						class="form-check-input"
						type="checkbox"
						data-column="created-at"
						on:change={handle_selected_column}
						checked={selected_columns.includes('created-at')}
					/>
					<span class="form-check-label">Created At</span>
				</label>
				<label class="form-check col-6">
					<input
						class="form-check-input"
						type="checkbox"
						data-column="expires-at"
						on:change={handle_selected_column}
						checked={selected_columns.includes('expires-at')}
					/>
					<span class="form-check-label">Expiration</span>
				</label>
				<label class="form-check col-6">
					<input
						class="form-check-input"
						type="checkbox"
						data-column="status"
						on:change={handle_selected_column}
						checked={selected_columns.includes('status')}
					/>
					<span class="form-check-label">Status</span>
				</label>
				<label class="form-check col-6">
					<input
						class="form-check-input"
						type="checkbox"
						data-column="usages"
						on:change={handle_selected_column}
						checked={selected_columns.includes('usages')}
					/>
					<span class="form-check-label">Usages</span>
				</label>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn me-auto" data-bs-dismiss="modal">Close</button>
				<button
					type="button"
					class="btn btn-primary"
					data-bs-dismiss="modal"
					on:click={handle_change_column}>Save changes</button
				>
			</div>
		</div>
	</div>
</div>

<div
	class="modal fade"
	id="delete-modal"
	tabindex="-1"
	aria-labelledby="delete-modal-label"
	aria-hidden="true"
>
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="delete-modal-label">Are you sure?</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			<div class="modal-body row w-100 m-0">
				<p>This action cannot be reverted, please continue carefully.</p>
			</div>
			<div class="modal-footer">
				<button type="button" class="btn me-auto" data-bs-dismiss="modal">Close</button>
				<button
					type="button"
					class="btn btn-danger"
					data-bs-dismiss="modal"
					on:click={handle_delete_selected}>Yes I'm sure</button
				>
			</div>
		</div>
	</div>
</div>

<div
	class="modal fade"
	id="qrcode-modal"
	tabindex="-1"
	aria-labelledby="qrcode-modal-label"
	aria-hidden="true"
>
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<h5 class="modal-title" id="qrcode-modal-label">QR Code</h5>
				<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
			</div>
			{#await handle_generate_qrcode()}
				<div class="modal-body row w-100 m-0 ratio ratio-1x1">
					<div class="ratio ratio-1x1">
						<h1 class="d-flex justify-content-center align-items-center">
							Loading <span class="animated-dots"></span>
						</h1>
					</div>
				</div>
			{:then { qrCodeImage, error }}
				<div class="modal-body row w-100 m-0 ratio ratio-1x1 pt-2">
					<img
						src={qrCodeImage}
						class="w-100 p-0"
						alt="QrCodeImage"
						style:image-rendering="pixelated"
					/>
				</div>
				<div class="modal-footer mt-3 row">
					<button type="button" class="btn col" data-bs-dismiss="modal">Close</button>
					<h3 class="text-primary text-center col">/~/{qrCode?.short_code}</h3>
					<button class="btn btn-primary col" on:click={handle_download_qrcode}>Download</button>
				</div>
			{/await}
		</div>
	</div>
</div>

<div
	class="toast position-absolute z-3 bottom-0 end-0 m-0 mb-3"
	data-bs-animation={true}
	role="alert"
	bind:this={toastRef}
	aria-live="assertive"
	aria-atomic="true"
	data-bs-autohide="true"
	data-bs-toggle="toast"
	data-bs-delay="3000"
>
	<div class="toast-header">
		<span class="avatar avatar-xs bg-primary me-2"><i class="ti ti-copy fs-3 text-white"></i></span>
		<strong class="me-auto">Snapp copied to Clipboard</strong>
		<button type="button" class="ms-2 btn-close" data-bs-dismiss="toast" aria-label="Close" />
	</div>
	<div class="toast-body">The short url has been copied to clip-board.</div>
</div>

<div class="page-header d-print-none">
	<div class="container-xl">
		<div class="row g-2 align-items-center flex-column flex-sm-row">
			<div class="col-12 col-sm-4">
				<div class="page-pretitle">URL Manager</div>
				<h2 class="page-title mt-2 fs-1 fw-bolder me-auto">Dashboard</h2>
			</div>
			<div
				class="col-12 col-sm-8 ms-auto align-self-end d-flex justify-content-start justify-content-sm-end"
			>
				<div class="btn-list">
					{#if selected.length > 0}
						<span class="d-inline">
							<button
								class="btn btn-outline-danger"
								data-bs-toggle="modal"
								data-bs-target="#delete-modal"
							>
								<i class="ti ti-trash"></i>
								<span class="ps-2"> Delete Selected ({selected.length})</span>
							</button>
						</span>
					{/if}
					<span class="d-inline">
						<a href="/dashboard/shorten" class="btn btn-primary"> Shorten an url </a>
					</span>
				</div>
			</div>
		</div>
		<div class="row mt-2 mt-sm-4">
			<div class="d-flex gap-2">
				<button
					class="btn btn-sm p-1 px-2 d-flex align-items-center"
					data-bs-toggle="modal"
					data-bs-target="#column-modal"
				>
					<span> Select Columns ({actual_columns.length}) </span>
					<i class="ti ti-columns-3 fs-3 ps-2"></i>
				</button>
				{#if data.query}
					<button class="btn btn-sm p-1 px-2 d-flex align-items-center" on:click={handle_search}>
						<span> Remove filters </span>
						<i class="ti ti-filter-off fs-3 ps-2"></i>
					</button>
				{/if}
				{#if data.sortBy}
					<button class="btn btn-sm p-1 px-2 d-flex align-items-center" on:click={handle_sorting}>
						<span> Remove sorting </span>
						<i class="ti ti-mobiledata-off fs-3 ps-2"></i>
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
<div class="page-body">
	<div class="container-xl">
		<div class="row row-cards">
			<div class="col-12">
				<div class="card">
					<div class="card-header">
						<h3 class="card-title">Short urls</h3>
					</div>
					<div class="card-body border-bottom py-3">
						<div class="d-flex flex-column gap-2 flex-md-row">
							<div class="text-secondary">
								<span> Show </span>
								<div class="mx-2 d-inline-block">
									<input
										type="text"
										class="form-control form-control-sm"
										on:input={debounce(handle_change_number_of_rows, 1000)}
										size="3"
										bind:value={max_entries}
										aria-label="count"
									/>
								</div>
								<span> entries </span>
							</div>
							<div class="ms-0 ms-md-auto text-secondary">
								<span> Search: </span>
								<div class="ms-2 d-inline-block">
									<input
										on:input={debounce(handle_search, 500)}
										type="text"
										class="form-control form-control-sm"
										aria-label="Search url"
										value={data.query}
									/>
								</div>
							</div>
						</div>
					</div>
					<div class="table-responsive">
						<table class="table card-table table-vcenter text-nowrap w-100 datatable">
							<thead>
								<tr>
									<th class="w-1">
										<input
											class="form-check-input m-0 align-middle"
											type="checkbox"
											disabled={snapps.length === 0}
											checked={selected_length}
											aria-label="Select all links"
											on:change={handle_select_all}
										/>
									</th>
									{#if actual_columns.includes('original-url')}
										<th class="w-auto">
											<button
												class="btn btn-ghost-real"
												data-column="original-url"
												on:click={handle_sorting}
											>
												<span> Original Url </span>
												{#if data.sortBy === 'original-url'}
													<i
														class="ti ps-2 fs-3"
														class:ti-sort-descending-2={sortDir === 'desc'}
														class:ti-sort-ascending-2={sortDir === 'asc'}
													></i>
												{/if}
											</button></th
										>
									{/if}
									{#if actual_columns.includes('short-code')}
										<th class="w-auto">
											<button
												class="btn btn-ghost-real"
												data-column="short-code"
												on:click={handle_sorting}
											>
												<span> Short code </span>
												{#if data.sortBy === 'short-code'}
													<i
														class="ti fs-3 ps-2"
														class:ti-sort-descending-2={sortDir === 'desc'}
														class:ti-sort-ascending-2={sortDir === 'asc'}
													></i>
												{/if}
											</button>
										</th>
									{/if}
									{#if actual_columns.includes('created-at')}
										<th class="w-auto">
											<button
												class="btn btn-ghost-real"
												data-column="created-at"
												on:click={handle_sorting}
											>
												<span> Created </span>
												{#if data.sortBy === 'created-at'}
													<i
														class="ti fs-3 ps-2"
														class:ti-sort-descending-2={sortDir === 'desc'}
														class:ti-sort-ascending-2={sortDir === 'asc'}
													></i>
												{/if}
											</button>
										</th>
									{/if}
									{#if actual_columns.includes('expires-at')}
										<th class="w-auto">
											<button
												class="btn btn-ghost-real"
												data-column="expires-at"
												on:click={handle_sorting}
											>
												<span> Expires </span>
												{#if data.sortBy === 'expires-at'}
													<i
														class="ti fs-3 ps-2"
														class:ti-sort-descending-2={sortDir === 'desc'}
														class:ti-sort-ascending-2={sortDir === 'asc'}
													></i>
												{/if}
											</button>
										</th>
									{/if}
									{#if actual_columns.includes('status')}
										<th class="w-auto">Status</th>
									{/if}
									{#if actual_columns.includes('usages')}
										<th class="w-auto">
											<button
												class="btn btn-ghost-real"
												data-column="usages"
												on:click={handle_sorting}
											>
												<span> Usages </span>
												{#if data.sortBy === 'usages'}
													<i
														class="ti fs-3 ps-2"
														class:ti-sort-descending-2={sortDir === 'desc'}
														class:ti-sort-ascending-2={sortDir === 'asc'}
													></i>
												{/if}
											</button>
										</th>
									{/if}
									<th class="w-auto"></th>
								</tr>
							</thead>
							<tbody>
								{#each snapps as snapp}
									<tr>
										<td
											><input
												class="form-check-input m-0 align-middle"
												type="checkbox"
												data-idx={snapp.id}
												aria-label="Select short url"
												on:change={handle_selected}
												checked={selected.includes(snapp.id)}
											/>
										</td>
										{#if actual_columns.includes('original-url')}
											<td class="w-auto"><span>{snapp.original_url}</span></td>{/if}
										{#if actual_columns.includes('short-code')}
											<td class="w-auto">
												<a href="/~/{snapp.short_code}" data-sveltekit-preload-data="off" class="text-reset" tabindex="-1">
													{snapp.short_code}
												</a>
											</td>
										{/if}
										{#if actual_columns.includes('created-at')}
											<td class="w-auto">
												{new Date(snapp.created_at).toLocaleDateString('en-UK')}</td
											>
										{/if}
										{#if actual_columns.includes('expires-at')}
											<td class="w-auto" class:text-secondary={!snapp.expires_at}>
												{snapp.expires_at
													? new Date(snapp.expires_at).toLocaleDateString('en-UK')
													: 'None'}
											</td>
										{/if}
										{#if actual_columns.includes('status')}
											<td class="w-auto">
												{#if snapp.expires_at && new Date(snapp.expires_at) <= new Date()}
													<span class="badge bg-danger me-1"></span> Expired
												{:else}
													<span class="badge bg-success me-1"></span> Active
												{/if}
											</td>
										{/if}
										{#if actual_columns.includes('usages')}
											<td class="w-auto">{snapp._count.usages}</td>
										{/if}
										<td class="text-end">
											<span class="dropdown btn-group">
												<button
													class="btn dropdown-toggle"
													data-bs-boundary="viewport"
													data-bs-toggle="dropdown">Actions</button
												>
												<div
													class="dropdown-menu"
													data-short_code={snapp.short_code}
													data-idx={snapp.id}
												>
													<button class="dropdown-item" on:click={handle_copy_shortcode}>
														Copy
													</button>
													<a class="dropdown-item" href="dashboard/edit/{snapp.id}"> Edit </a>
													<button
														class="dropdown-item"
														on:click={handle_show_qrcode}
														data-idx={snapp.id}
														data-bs-toggle="modal"
														data-bs-target="#qrcode-modal"
													>
														QR Code
													</button>
													<button
														class="dropdown-item"
														on:click={handle_delete_shortcode}
														data-bs-toggle="modal"
														data-bs-target="#delete-modal"
													>
														Delete
													</button>
												</div>
											</span>
										</td>
									</tr>
								{/each}
								{#each { length: max_entries - snapps.length } as emptyRow}
									<tr>
										<td
											><input
												class="form-check-input m-0 align-middle"
												type="checkbox"
												disabled
												aria-label="Select invoice"
											/></td
										>
										{#if actual_columns.includes('original-url')}
											<td class="w-auto"></td>
										{/if}
										{#if actual_columns.includes('short-code')}
											<td class="w-auto"></td>
										{/if}
										{#if actual_columns.includes('created-at')}
											<td class="w-auto"></td>
										{/if}
										{#if actual_columns.includes('expires-at')}
											<td class="w-auto"></td>
										{/if}
										{#if actual_columns.includes('status')}
											<td class="w-auto"></td>
										{/if}
										{#if actual_columns.includes('usages')}
											<td class="w-auto"></td>
										{/if}
										<td class="text-end">
											<span class="dropdown">
												<button
													disabled
													class="btn dropdown-toggle align-text-top"
													data-bs-boundary="viewport"
													data-bs-toggle="dropdown">Actions</button
												>
											</span>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					<div class="card-footer d-flex align-items-center">
						<p class="m-0 text-secondary">
							Showing <span>1</span> to
							<span>{data.total < data.max_entries ? data.total : data.max_entries}</span>
							of <span>{data.total}</span> entries
						</p>
						<ul class="pagination m-0 ms-auto gap-1">
							{#if data.page !== 1}
								<li class="page-item">
									<button
										data-page={data.page - 1}
										on:click={handle_pagination}
										class="page-link d-flex align-items-center"
										tabindex="-1"
									>
										<i class="ti ti-chevron-left"></i> <span> Prev </span>
									</button>
								</li>
							{/if}
							{#if data.page > 1}<li class="page-item">
									<button on:click={handle_pagination} class="page-link" data-page={data.page - 1}
										>{data.page - 1}</button
									>
								</li>{/if}
							<li class="page-item active">
								<button on:click={handle_pagination} class="page-link" data-page={data.page}
									>{data.page}</button
								>
							</li>
							{#if data.end_reached === false}
								<li class="page-item">
									<button on:click={handle_pagination} class="page-link" data-page={data.page + 1}
										>{data.page + 1}</button
									>
								</li>

								<li class="page-item">
									<button
										on:click={handle_pagination}
										class="page-link d-flex align-items-center"
										data-page={data.page + 1}
										aria-disabled={data.end_reached}
									>
										<span> Next </span>
										<i class="ti ti-chevron-right"> </i></button
									>
								</li>
							{/if}
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.toast.show {
		animation: var(--animation-slide-in-left) forwards;
	}

	.btn-ghost-real {
		background-color: transparent;
		border: none;
		outline: none;
		box-shadow: none;
		font-size: inherit;
		text-transform: inherit;
		color: inherit;
		text-shadow: inherit;
		font-weight: inherit;
		letter-spacing: inherit;
		padding: 0;
	}
</style>
