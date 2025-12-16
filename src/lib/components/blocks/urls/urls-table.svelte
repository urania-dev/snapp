<script lang="ts" generics="TData, TValue">
	import type { tag } from '$lib/server/db/schema';

	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import Columns2Icon from '@lucide/svelte/icons/columns-2';
	import FunnelIcon from '@lucide/svelte/icons/funnel';
	import LinkIcon from '@lucide/svelte/icons/link-2';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Rows3Icon from '@lucide/svelte/icons/rows-3';
	import SearchIcon from '@lucide/svelte/icons/search';
	import TagIcon from '@lucide/svelte/icons/tag';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import {
		type ColumnDef,
		type ColumnFiltersState,
		getCoreRowModel,
		getFilteredRowModel,
		getPaginationRowModel,
		getSortedRowModel,
		type PaginationState,
		type RowSelectionState,
		type SortingState,
		type VisibilityState
	} from '@tanstack/table-core';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Command from '$lib/components/ui/command/index.js';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import * as Empty from '$lib/components/ui/empty/index';
	import * as Field from '$lib/components/ui/field/index';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Table from '$lib/components/ui/table/index';
	import { Debouncer } from '$lib/hooks/debounce.svelte';
	import { m } from '$lib/paraglide/messages';
	import { updateColumns, updateRows } from '$lib/remotes/config.remote';
	import { createTag } from '$lib/remotes/urls.remote';
	import { slugify } from '$lib/utils';
	import { tick } from 'svelte';
	import { queryParameters, ssp } from 'sveltekit-search-params';

	import TableDeleteUrlModal from './table-delete-url-modal.svelte';

	let {
		columns,
		columnVisibility = $bindable(),
		data,
		hideCreate = false,
		limit = 5,
		rowCount,
		selected = $bindable(),
		showDelete = $bindable(false),
		tagList
	}: DataTableProps<TData, TValue> = $props();
	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		columnVisibility: VisibilityState;
		data: TData[];
		hideCreate?: boolean;
		limit: number;
		rowCount: number;
		selected: null | string;
		showDelete: boolean;
		tagList: (typeof tag.$inferSelect)[];
	};
	let columnFilters = $state<ColumnFiltersState>([]);

	let rowSelection = $state<RowSelectionState>({});
	let sortingState = $state<SortingState>([]);
	let paginationState = $state<PaginationState>({
		pageIndex: 0,
		// eslint-disable-next-line svelte/no-unused-svelte-ignore
		// svelte-ignore state_referenced_locally
		pageSize: limit
	});

	const params = queryParameters(
		{
			desc: ssp.boolean(),
			// eslint-disable-next-line svelte/no-unused-svelte-ignore
			// svelte-ignore state_referenced_locally
			limit: ssp.number(limit),
			page: ssp.number(),
			query: true,
			sort: ssp.string(),
			tags: {
				decode(value) {
					return value?.split(',') || [];
				},
				defaultValue: [] as string[],
				encode(value) {
					return value.join(',');
				}
			}
		},
		{ debounceHistory: 300, showDefaults: false }
	);
	const table = createSvelteTable({
		// eslint-disable-next-line svelte/no-unused-svelte-ignore
		// svelte-ignore state_referenced_locally
		columns,
		get data() {
			return data;
		},
		getCoreRowModel: getCoreRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getRowId(originalRow, index) {
			const row = originalRow as { id: string };
			const idx = 'id' in row ? row.id : index.toString();
			return idx;
		},
		getSortedRowModel: getSortedRowModel(),
		manualFiltering: true,
		manualPagination: true,
		manualSorting: true,
		onColumnFiltersChange: async (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility = updater(columnVisibility);
			} else {
				columnVisibility = updater;
			}
		},
		onPaginationChange: async (updater) => {
			if (typeof updater === 'function') {
				paginationState = updater(paginationState);
			} else {
				paginationState = {
					pageIndex: updater.pageSize,
					pageSize: updater.pageIndex
				};
			}
			params.page = paginationState.pageIndex;
			params.limit = paginationState.pageSize;
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
			selected = Object.keys(rowSelection)?.[0] || null;
		},
		onSortingChange: async (updater) => {
			if (typeof updater === 'function') {
				sortingState = updater(sortingState || []);
			} else {
				sortingState = updater;
			}
			params.sort = sortingState[0]?.id;
			params.desc = sortingState[0]?.desc;
		},
		// eslint-disable-next-line svelte/no-unused-svelte-ignore
		// svelte-ignore state_referenced_locally
		rowCount,
		state: {
			get columnFilters() {
				return columnFilters;
			},
			get columnVisibility() {
				return columnVisibility;
			},
			get pagination() {
				return paginationState;
			},
			get rowSelection() {
				return rowSelection;
			},
			get sorting() {
				return sortingState || [];
			}
		}
	});

	const getLabel = (id: string) => {
		switch (id) {
			case 'createdAt':
				return m.created_at();
			case 'enabled':
				return m.enabled();
			case 'expiresAt':
				return m.expires_at();
			case 'hit':
				return m.hit();
			case 'limit':
				return m.limits();
			case 'originalUrl':
				return m.original_url();
			case 'secret':
				return m.secret();
			case 'shortcode':
				return m.shortcode();
			case 'status':
				return m.status();
			case 'updatedAt':
				return m.updated_at();
			case 'utm':
				return m.utm();
		}
	};

	const d = new Debouncer();

	let showToggleColumn = $state(false);
	let showTags = $state(false);
	let triggerRefTags = $state<HTMLButtonElement>(null!);

	const selectedTags = $derived(
		tagList?.filter((f) => params.tags.includes(f.id)).map((t) => t.tag) || []
	);
	const closeAndFocusTriggerTags = () => {
		showTags = false;
		tick().then(() => {
			triggerRefTags.focus();
		});
	};
	let tagQuery = $state<string>('');
	const forceMount = $derived(tagList?.filter((t) => t.tag.includes(tagQuery))?.length === 0 || []);
</script>

<div class="@container flex w-full grow flex-col divide-y">
	<div class="flex w-full flex-col items-center justify-between @lg:flex-row">
		<div class="flex w-full flex-col items-center px-4 pt-4 @lg:py-4">
			<Field.Field orientation="responsive" class="w-full @lg:max-w-max @lg:me-auto">
				<Field.Label class="sr-only" for="search">{m.urls_search_placeholder()}</Field.Label>
				<InputGroup.Root class="h-8">
					<InputGroup.Addon>
						<SearchIcon class="size-4!" />
					</InputGroup.Addon>
					<InputGroup.Input
						id="search"
						placeholder={m.urls_search_placeholder()}
						class="h-9 w-full max-w-sm"
						oninput={(e) => {
							const value = e.currentTarget.value;
							d.debounce(() => {
								params.query = value;
							}, 250)();
						}}
					/>
				</InputGroup.Root>
			</Field.Field>
		</div>

		<div class="flex w-full flex-col items-center divide-x @lg:w-max @lg:flex-row @lg:border-s!">
			<Field.Field class="p-4">
				<Popover.Root bind:open={showTags}>
					<Popover.Trigger bind:ref={triggerRefTags}>
						{#snippet child({ props })}
							<Button
								variant="outline"
								class="justify-between w-full"
								{...props}
								role="combobox"
								aria-expanded={showTags}
								><TagIcon />
								<span class="text-start w-full">
									{selectedTags.join(', ') || m.select_tags()}
								</span>
								<ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="p-0 w-[calc(100%-.25rem)] ms-auto" align="end">
						<Command.Root shouldFilter={false}>
							<Command.Input
								oninput={() => (tagQuery = slugify(tagQuery))}
								placeholder={m.search()}
								bind:value={tagQuery}
							/>
							<Command.List>
								<Command.Empty
									>{#if forceMount}<Button
											variant="ghost"
											size="sm"
											onclick={async () => {
												const { t } = await createTag(slugify(tagQuery));
												await invalidateAll();
												params.tags.push(t.id);
											}}><span>{tagQuery}</span><PlusIcon /></Button
										>{:else}<span>{m.tags_search_placeholder()}</span>{/if}</Command.Empty
								>
								<Command.Group>
									{#each tagList.filter((t) => t.tag.includes(tagQuery)) as tag (tag)}
										<Command.Item
											value={tag.id}
											onSelect={() => {
												if (params.tags.includes(tag.tag)) {
													const filtered = params.tags.filter((t) => t !== tag.tag);
													params.tags = filtered.length ? filtered : (null as unknown as []);
												} else params.tags.push(tag.tag);
												d.debounce(() => {
													closeAndFocusTriggerTags();
												}, 1000)();
											}}
										>
											<CheckIcon
												class={[
													'me-2 size-4',
													!params.tags.includes(tag.tag) && 'text-transparent'
												]}
											/>
											{tag.tag}
										</Command.Item>
									{/each}
								</Command.Group>
							</Command.List>
						</Command.Root>
					</Popover.Content>
				</Popover.Root>
			</Field.Field>
			<div class="flex w-full flex-col p-4 pt-0 @lg:py-4!">
				<DropdownMenu.Root bind:open={showToggleColumn}>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" size="sm" class="w-full @lg:w-max">
								<Columns2Icon />
								{m.columns()}
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						{#each table.getAllColumns().filter((col) => col.getCanHide()) as column (column.id)}
							<DropdownMenu.CheckboxItem
								class="capitalize"
								closeOnSelect={false}
								onCheckedChange={async () => {
									await updateColumns({ columns: columnVisibility, cookie: 'url-columns' });
									await invalidateAll();
									d.debounce(() => {
										showToggleColumn = false;
									}, 1000)();
								}}
								bind:checked={() => column.getIsVisible(), (v) => column.toggleVisibility(!!v)}
							>
								{getLabel(column.id)}
							</DropdownMenu.CheckboxItem>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
			{#if !hideCreate}
				<div class="flex w-full flex-col items-center px-4 pb-4 @lg:py-4!">
					<Button class="w-full" href={resolve('/urls/new')} size="sm">{m.urls_create_new()}</Button
					>
				</div>
			{/if}
		</div>
	</div>
	<div class="flex h-full w-full flex-col p-4">
		<div class="h-full rounded-md border">
			<Table.Root class="h-full">
				<Table.Header>
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row>
							{#each headerGroup.headers as header (header.id)}
								<Table.Head
									colspan={header.colSpan}
									class={[
										['shortcode'].includes(header.id) && 'w-full max-w-[60%]',
										['originalUrl'].includes(header.id) && 'w-full max-w-[40%]!',
										'id' === header.id && 'w-8',
										'actions' === header.id && 'w-10! min-w-10!'
									]}
								>
									{#if !header.isPlaceholder}
										<FlexRender
											content={header.column.columnDef.header}
											context={header.getContext()}
										/>
									{/if}
								</Table.Head>
							{/each}
						</Table.Row>
					{/each}
				</Table.Header>
				<Table.Body>
					{#each table.getRowModel().rows as row (row.id)}
						<Table.Row
							data-state={row.getIsSelected() && 'selected'}
							class="h-10"
							onclick={(e) => {
								if (
									(e.target && e.target instanceof HTMLAnchorElement) ||
									e.target instanceof HTMLButtonElement
								)
									return;
								e.preventDefault();
								const isSelected = row.getIsSelected();
								setTimeout(() => {
									row.toggleSelected(!isSelected);
								}, 5);
							}}
						>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell class="h-10! py-1 pe-1 {cell.column.id === 'actions' && 'p-0! w-10'}">
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}

					{#if table.getRowModel().rows.length === 0}
						<Table.Row>
							<Table.Cell colspan={columns.length} class="content-center text-center ">
								{#if !hideCreate}<Empty.Root>
										<Empty.Header>
											<Empty.Media variant="icon">
												<LinkIcon />
											</Empty.Media>
											<Empty.Title>{m.urls()}</Empty.Title>
											<Empty.Description>
												{m.no_results()}
											</Empty.Description>
										</Empty.Header>
										<Empty.Content>
											<div class="flex gap-2">
												<Button class="text-sm" href={resolve('/urls/new')}>
													<PlusIcon fill="currentColor" fill-opacity={0.25} />
													<span>{m.urls_create_new()}</span>
												</Button>
											</div>
										</Empty.Content>
									</Empty.Root>
								{:else}
									<p>{m.no_results()}</p>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/if}
					{#if table.getRowModel().rows.length}
						{#each { length: limit - table.getRowModel().rows.length }, idx (idx)}
							<Table.Row class="h-10">
								<Table.Cell class="h-10! py-1" colspan={table.getAllColumns().length}></Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
	<div
		class="@container/buttons flex w-full flex-col flex-wrap @lg:flex-nowrap @lg:flex-row! @lg:items-center @lg:divide-x divide-y @lg:divide-y-0"
	>
		<div class="flex p-4 @lg:w-full @lg:max-w-max @lg:pb-4">
			<Field.Field orientation="responsive" class="h-8! w-full @lg:max-w-max!">
				<Field.Label class="sr-only" for="rows">{m.rows()}</Field.Label>
				<InputGroup.Root class="h-8! w-full!">
					<InputGroup.Addon>
						<Rows3Icon class="size-4!" />
					</InputGroup.Addon>
					<InputGroup.Input
						id="rows"
						type="number"
						class="w-full text-center @lg:max-w-[7.5ch]"
						name="rows"
						oninput={() => {
							if (!limit) return;
							d.debounce(async () => {
								await updateRows({ cookie: 'url-rows', rows: limit.toString() });
							}, 500)();
						}}
						bind:value={limit}
					/>
				</InputGroup.Root>
			</Field.Field>
		</div>
		<div class="p-4">
			<ButtonGroup.Root class="w-full @lg:w-fit">
				<Button
					class="grow @lg:w-max"
					size="sm"
					variant="outline"
					disabled={(!sortingState || sortingState?.length === 0) &&
						(!params.tags || params.tags.length === 0)}
					onclick={async () => {
						table.resetColumnFilters();
						table.resetSorting();
						params.page = null;
						params.limit = null as unknown as number;
						params.tags = null as unknown as string[];
						await invalidateAll();
					}}
				>
					<FunnelIcon />
					{m.remove_filters()}
				</Button>

				<Button
					variant="outline"
					size="sm"
					class="grow @lg:w-max @lg:grow-0"
					onclick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<ChevronLeft />
				</Button>

				<Button
					variant="outline"
					size="sm"
					class=" grow @lg:w-max @lg:grow-0"
					onclick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					<ChevronRight />
				</Button>
			</ButtonGroup.Root>
		</div>
		<div class="w-full"></div>
		<div class="p-4">
			<Button
				size="sm"
				class="w-full @xl:w-max"
				variant="destructive"
				disabled={table.getSelectedRowModel().rows.length === 0}
				onclick={() => (showDelete = true)}
			>
				<TrashIcon />
				<span>{m.delete()}</span>
			</Button>
		</div>
	</div>
</div>

<TableDeleteUrlModal
	bind:showDelete
	getRows={() => table.getSelectedRowModel().rows.map((r: { id: string }) => r)}
	clearSelection={() => {
		table.resetRowSelection();
	}}
/>
