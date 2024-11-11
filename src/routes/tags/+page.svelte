<script lang="ts">
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import Input from '$lib/ui/input.svelte';
	import { hover } from '$lib/utils/hover';
	import { _ } from 'svelte-i18n';
	import { fade, fly } from 'svelte/transition';
	import { queryParam } from 'sveltekit-search-params';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import { outside } from '$lib/utils/outside';
	import { slugify } from '$lib/utils/slug';
	import type { MouseEventHandler } from 'svelte/elements';
	import { applyAction, enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { invalidateAll } from '$app/navigation';
	import { debounce } from 'chart.js/helpers';
	import Select from '$lib/ui/select.svelte';
	let { data, form } = $props();
	const query = queryParam('query');

	const limit = queryParam(
		'limit',
		{
			defaultValue: data.limit as number | undefined,
			decode: (val: string | null) => (val ? parseInt(val) : null),
			encode: (val: number) => val.toString()
		},
		{ showDefaults: false }
	);

	const orderBy = queryParam(
		'order-by',
		{
			encode: (str: string) => str as string,
			decode: (str: string | null) => str as string | null,
			defaultValue: undefined as string | undefined
		},
		{ showDefaults: false }
	);

	const ascending = queryParam(
		'ascending',
		{
			defaultValue: undefined as boolean | undefined,
			encode: (booleanValue) => booleanValue.toString(),
			decode: (stringValue) => stringValue !== null && stringValue !== 'false'
		},
		{ showDefaults: false }
	);

	const pageParam = queryParam(
		'page',
		{
			defaultValue: 1,
			encode: (number) => number.toString(),
			decode: (stringedNumber) => (stringedNumber && parseInt(stringedNumber)) || null
		},
		{ showDefaults: false }
	);

	const max_pages = $derived(Math.ceil(data.count / ($limit || data.limit)));
	let show_confirm_panel = $state(false);
	let show_tag_panel = $state(false);
	let tag_action = $state<string>();

	let innerWidth = $state<number>(0);

	let _tag = $state<Partial<(typeof data.tags)[0]>>({
		id: undefined,
		name: undefined,
		notes: undefined,
		slug: undefined
	});

	let editing_tag = $state<number | undefined>(undefined);
	const handle_save: MouseEventHandler<HTMLButtonElement> = (e) => {
		if (tag_action === 'create') {
			document.forms.namedItem('create')?.requestSubmit();
		}
		if (tag_action === 'edit') {
			document.forms.namedItem('edit')?.requestSubmit();
		}
		if (tag_action === 'delete') {
			document.forms.namedItem('delete')?.requestSubmit();
		}
		if (tag_action === 'delete-all') {
			document.forms.namedItem('delete-all')?.requestSubmit();
		}
	};

	let id_to_delete = $state<string>();
	const enhanceTagAction: SubmitFunction = ({ formData, cancel }) => {
		if (id_to_delete) formData.set('id', id_to_delete);
		if (_tag.name === undefined || _tag.slug === undefined) {
			toast.info($_('tags.errors.name-invalid'));
			return cancel();
		}
		if (_tag) formData.set('tag', JSON.stringify(_tag));

		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
			id_to_delete = undefined;
			close_and_reset_form();
		};
	};

	let selected = $state<string[]>([]);
	let default_columns = ['name', 'slug', 'users', 'snapps'];

	const handle_select_this: MouseEventHandler<HTMLButtonElement> = (e) => {
		const idx = e.currentTarget.dataset.idx;
		if (!idx) return;
		if (idx === 'all') {
			if (selected.length === data.tags.length) {
				selected.splice(0, selected.length);
			} else {
				selected = [];
				for (let snapp of data.tags) {
					selected.push(snapp.id);
				}
			}
		} else if (selected.includes(idx)) {
			const index = selected.findIndex((i) => i === idx);
			selected.splice(index, 1);
		} else selected.push(idx);
	};

	const open_edit_panel: MouseEventHandler<HTMLButtonElement> = (e) => {
		e.stopPropagation();
		e.preventDefault();
		tag_action = 'edit';
		const idx = e.currentTarget.dataset.idx;
		if (!idx) return;
		const tagIndexInTags = data.tags.findIndex((s) => s.id === idx);
		const tag = data.tags[tagIndexInTags];
		if (!tag) return;
		_tag = tag;
		editing_tag = tagIndexInTags;
		show_tag_panel = true;
	};
	let show_column_panel = $state(false);
	let columns = $state(data.cols);
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

	const enhanceSaveColumn: SubmitFunction = ({ formData }) => {
		formData.set('columns', JSON.stringify(columns));
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
		};
	};

	let limitValue = $state<number>(data.limit);

	const enhanceRows: SubmitFunction = ({ formData }) => {
		formData.set('rows', limitValue.toString());
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
			$limit = limitValue;
		};
	};

	const enhanceDeleteAction: SubmitFunction = ({ formData, cancel }) => {
		if (!selected.length) return cancel();
		formData.set('ids', JSON.stringify(selected));
		return async ({ result }) => {
			await applyAction(result);
			await invalidateAll();
			if (form?.message) toast.info($_(form.message));
			if (form?.success === true) close_and_reset_form();
		};
	};

	const close_and_reset_form = () => {
		show_confirm_panel = false;
		show_tag_panel = false;
		_tag.id = undefined;
		_tag.name = undefined;
		_tag.slug = undefined;
		selected = [];
	};
</script>

<svelte:head>
	<title>{$_('appname')} | {$_('menu.tags')}</title>
	<meta
		name="description"
		content="Self-hostable Open Source Url Shortner. Discover more at https://github.com/urania-dev/snapp"
	/>
</svelte:head>
<svelte:window bind:innerWidth />
<form
	action="?/save-cols"
	id="save-columns"
	hidden
	use:enhance={enhanceSaveColumn}
	method="post"
></form>
<form action="?/create" id="create" hidden method="post" use:enhance={enhanceTagAction}></form>
<form action="?/delete" id="delete" hidden method="post" use:enhance={enhanceTagAction}></form>
<form action="?/edit" id="edit" hidden method="post" use:enhance={enhanceTagAction}></form>
<form
	action="?/delete-all"
	id="delete-all"
	hidden
	use:enhance={enhanceDeleteAction}
	method="post"
></form>
<div class="flex h-full w-full flex-col overflow-hidden p-4">
	<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
		<div class="flex h-8 items-center gap-2">
			<Icon ph="tag-simple" size={36} />
			<h2 class="text-2xl font-bold">
				{$_('menu.tags')}
			</h2>
		</div>
		<div class="flex w-full h-full overflow-clip">
			<Card css={{ card: 'gap-4 h-full' }}>
				<Card css={{ card: 'flex md:flex-row md:h-12 gap-2 items-center justify-between p-2' }}>
					<Input
						name="search"
						placeholder={$_('tags.placeholders.search')}
						css={{
							field: 'max-h-12 md:max-h-8 p-0 flex-row md:max-w-[19rem]',
							input: 'text-sm max-h-12 md:max-h-8',
							group: 'max-h-12 min-h-12 md:max-h-8 md:min-h-8',
							label: 'hidden'
						}}
						icons={{ left: 'magnifying-glass' }}
						bind:value={$query}
					/>
					{#if selected.length === 0 && (data.tagsAsPrefix === false || data.is_admin)}
						<button
							onclick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								show_tag_panel = true;
								tag_action = 'create';
							}}
							class="flex h-12 w-full items-center gap-2 rounded border border-slate-500/50 p-0 px-2 text-sm font-semibold hover:bg-slate-500 hover:text-neutral-50 md:h-8 md:w-max md:justify-center"
						>
							<Icon ph="plus" />
							<span class="ps-3 md:p-0">{$_('tags.labels.create')}</span>
						</button>
					{:else if data.tagsAsPrefix === false || data.is_admin}
						<button
							in:fade
							onclick={(e) => {
								e.stopPropagation();
								show_confirm_panel = true;
								tag_action = 'delete-all';
							}}
							class="flex h-12 w-full items-center gap-2 rounded border border-red-500/50 p-0 px-4 text-sm font-semibold transition-all hover:bg-red-500/25 hover:text-neutral-50 md:h-8 md:w-max md:justify-center lg:px-2"
						>
							<Icon ph="trash" />
							<small class="text-sm ps-3 leading-none md:p-0">{$_('globals.delete')}</small>
						</button>{/if}
				</Card>
				<Card
					css={{
						card: 'flex h-full w-full flex-wrap content-start items-start gap-4 overflow-y-scroll'
					}}
				>
					{#if data.tags.length}
						<table class="w-full table-auto text-sm">
							<thead>
								<tr class="table-row h-10">
									<th class="px-2 table-cell" style:width="1.5rem">
										<button
											class="flex h-5 w-5 items-center justify-center rounded border border-slate-500/50 bg-neutral-50 dark:bg-neutral-950"
											onclick={handle_select_this}
											data-idx="all"
										>
											{#if selected.length === data.tags.length}
												<Icon ph="check" size={14} />
											{:else if selected.length === 0}
												&nbsp;
											{:else}
												<Icon ph="circle" size={4} style="fill" />
											{/if}
										</button>
									</th>
									{#if columns.includes('name')}
										<th class="table-cell w-max px-2">
											<div
												class="flex h-full w-full items-center justify-start gap-2 whitespace-nowrap text-xxs uppercase tracking-wider"
											>
												<span>{$_('tags.labels.name')}</span>
											</div>
										</th>
									{/if}
									{#if columns.includes('slug')}
										<th class="table-cell w-max px-2">
											<div
												class="flex h-full w-full items-center justify-start gap-2 whitespace-nowrap text-xxs uppercase tracking-wider"
											>
												<span>{$_('tags.labels.slug')}</span>
											</div>
										</th>
									{/if}
									{#if columns.includes('users')}
										<th class="table-cell w-10 px-2">
											<div
												class="flex h-full w-full items-center justify-start gap-2 whitespace-nowrap text-xxs uppercase tracking-wider"
											>
												<span>{$_('menu.users')}</span>
											</div>
										</th>
									{/if}
									{#if columns.includes('snapps')}
										<th class="table-cell w-10 px-2">
											<div
												class="flex h-full w-full items-center justify-start gap-2 whitespace-nowrap text-xxs uppercase tracking-wider"
											>
												<span>{$_('tags.labels.snapps')}</span>
											</div>
										</th>
									{/if}
									<th class="table-cell"></th>
								</tr></thead
							><tbody>
								{#each data.tags as tag, idx}
									<tr
										class="h-14 w-full border border-slate-500/25 bg-slate-500/5 p-4 transition-all hover:bg-slate-500/15 md:h-12"
									>
										<th class="px-2 table-cell" style:width="1.5rem">
											<button
												class="flex h-5 w-5 items-center justify-center rounded border border-slate-500/50 bg-neutral-50 dark:bg-neutral-950"
												onclick={handle_select_this}
												data-idx={tag.id}
											>
												{#if selected.includes(tag.id)}
													<Icon ph="check" size={14} />
												{:else}
													&nbsp;
												{/if}
											</button>
										</th>
										{#if columns.includes('name')}
											<td
												class="table-cell w-52 max-w-52 overflow-hidden text-ellipsis whitespace-nowrap px-2 align-middle"
											>
												<a class="link" href="/tags/{tag.slug}">
													{tag.name}
												</a>
											</td>
										{/if}
										{#if columns.includes('slug')}
											<td
												class="table-cell w-52 max-w-52 overflow-hidden text-ellipsis whitespace-nowrap px-2 align-middle"
											>
												{tag.slug}
											</td>
										{/if}
										{#if columns.includes('users')}
											<td
												class="table-cell w-52 max-w-52 overflow-hidden text-ellipsis whitespace-nowrap px-2 align-middle"
											>
												{tag._count.users}
											</td>
										{/if}
										{#if columns.includes('snapps')}
											<td
												class="table-cell w-52 max-w-52 overflow-hidden text-ellipsis whitespace-nowrap px-2 align-middle"
											>
												{tag._count.snapps}
											</td>
										{/if}
										<td class=" table-cell w-40 whitespace-nowrap px-2 text-end align-middle">
											<div class="flex w-full justify-end gap-2">
												{#if data.is_admin}
													<button
														data-idx={tag.id}
														onclick={(e) => {
															_tag.id = undefined;
															e.stopPropagation();
															_tag = tag;
															id_to_delete = tag.id;
															tag_action = 'delete';
															show_confirm_panel = true;
														}}
														in:fly|global={{ delay: 75, y: 24 }}
														class="flex h-10 w-10 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-red-500/50 focus:bg-red-500/50 md:h-8 md:w-8"
														><Icon ph="trash"></Icon>
													</button>
													<button
														data-idx={tag.id}
														onclick={open_edit_panel}
														in:fly|global={{ delay: 75 * 2, y: 24 }}
														class="flex h-10 w-10 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
														><Icon ph="pencil"></Icon>
													</button>
												{/if}
												<a
													href="/tags/{tag.slug}"
													in:fly|global={{ delay: 75 * 3, y: 24 }}
													class="flex h-10 w-10 items-center justify-center rounded border-none bg-slate-500/25 p-0 text-start outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
													><Icon ph="eye"></Icon>
												</a>
											</div>
										</td>
									</tr>
								{/each}
								{#each { length: Math.max(0, data.limit - data.tags.length) } as tag, idx}
									<tr
										class="h-14 w-full border border-slate-500/25 bg-slate-500/5 p-4 transition-all hover:bg-slate-500/15 md:h-12"
									>
										<th class="px-2 table-cell" colspan={columns.length + 2}> </th>
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
				<Card css={{ card: 'p-2 md:h-12 flex-row justify-between' }}>
					<div class="flex w-full items-center justify-start gap-2 p-0 font-semibold">
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

						<button
							onclick={() => ($pageParam = Math.max(1, ($pageParam || 1) - 1))}
							class="flex h-12 w-12 items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
						>
							<Icon ph="arrow-left" />
						</button>
						<button
							onclick={() => {
								if ($pageParam && max_pages === Number($pageParam))
									toast.info($_('globals.max-page-reached'));
								$pageParam = Math.min(max_pages, Number($pageParam) + 1);
							}}
							class="flex h-12 w-12 items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-8"
						>
							<Icon ph="arrow-right" />
						</button>
						<button
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								show_column_panel = !show_column_panel;
							}}
							class="flex h-12 w-12 items-center justify-center gap-2 rounded border border-slate-500/50 px-4 text-sm outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50 md:h-8 md:w-auto"
						>
							<Icon ph="gear" css={{ icon: 'w-max h-max' }} />
							<span class="hidden text-sm font-semibold md:flex">{$_('snapps.labels.columns')}</span
							>
						</button>
					</div>

					<div class="hidden sm:flex w-full items-center justify-end gap-2 p-0 font-semibold">
						<small>{$_('globals.total')} {$_('menu.tags').toLowerCase()}</small>
						<small>:</small><small
							class="flex aspect-square h-8 min-w-8 shrink-0 items-center justify-center rounded bg-slate-500/15 p-2"
							>{data.count}</small
						>
					</div>
				</Card>
			</Card>
		</div>
	</div>
</div>

{#if ((data.tagsAsPrefix === false || data.is_admin) && show_tag_panel === true && tag_action === 'create') || (tag_action === 'edit' && editing_tag !== undefined && show_tag_panel)}
	<div class="fixed inset-0 z-[29] bg-neutral-950/50" transition:fade></div>
	<div
		use:outside={() => {
			show_tag_panel = false;
		}}
		class="fixed bottom-0 right-0 top-0 z-30 flex h-full w-full max-w-sm flex-col gap-4 border-l border-slate-500/50 bg-neutral-50 p-4 text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
		transition:fly={{ x: '100%' }}
	>
		<h4 class="text-lg font-bold leading-relaxed tracking-wide">
			{$_(`tags.labels.${tag_action}`)}
		</h4>
		{#if tag_action === 'create'}
			<p>{$_('tags.helpers.creation')}</p>
		{/if}
		<Input
			type="text"
			name="name"
			css={{ input: 'text-sm' }}
			label={$_('tags.labels.name')}
			icons={{ left: 'lock' }}
			actions={{
				input: (e) => {
					_tag.slug = slugify(e.currentTarget.value);
				}
			}}
			bind:value={_tag.name}
		/>
		<Input
			type="text"
			actions={{
				input: (e) => {
					_tag.slug = slugify(e.currentTarget.value);
				}
			}}
			name="slug"
			css={{ input: 'text-sm' }}
			label={$_('tags.labels.slug')}
			icons={{ left: 'hash' }}
			bind:value={_tag.slug}
		/>
		<div class="flex h-full flex-col gap-2">
			<Input
				type="textarea"
				css={{ field: 'h-full' }}
				name="notes"
				label={$_('tags.labels.notes')}
				bind:value={_tag.notes}
			/>
			<small class="px-1">{$_('tags.helpers.notes')}</small>
		</div>
		<div class="flex w-full gap-4">
			<button
				onclick={close_and_reset_form}
				class="flex h-10 w-full items-center justify-center rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-slate-500/50 focus:bg-slate-500/50"
				><small class="pt-0.5 font-semibold">
					{$_('globals.close')}
				</small>
			</button>
			<button
				onclick={handle_save}
				class="flex h-10 w-full items-center justify-center gap-2 rounded border-none bg-slate-500/25 outline-none transition-all hover:bg-green-500/50 focus:bg-green-500/50"
				><Icon ph="floppy-disk" size={16} /><small class="pt-0.5 font-semibold">
					{$_('globals.save')}
				</small>
			</button>
		</div>
	</div>
{/if}

{#if (data.tagsAsPrefix === false || data.is_admin) && show_confirm_panel}
	<div class="fixed inset-0 z-[29] flex flex-col bg-neutral-950/50" transition:fade>
		<div
			use:outside={() => {
				show_confirm_panel = false;
			}}
			class="z-30 m-auto flex rounded w-full max-w-sm flex-col gap-4 overflow-y-scroll text-balance border border-slate-500/50 bg-neutral-50 p-4 leading-relaxed text-neutral-950 transition-colors dark:bg-neutral-950 dark:text-neutral-50"
			transition:fly={{ y: 25 }}
		>
			<h4>{$_('globals.sure-ask')}</h4>
			<p>{$_('tags.helpers.confirm-delete')}</p>
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
					data-idx={tag_action}
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
							{$_('tags.labels.' + column.replaceAll('_', '-'))}
						</small>
					</button>
				{/each}
			</div>
		</div>
	</div>
{/if}
