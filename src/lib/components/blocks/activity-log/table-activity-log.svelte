<script lang="ts" generics="TData, TValue">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Columns2Icon from '@lucide/svelte/icons/columns-2';
	import FunnelIcon from '@lucide/svelte/icons/funnel';
	import Rows3Icon from '@lucide/svelte/icons/rows-3';
	import RssIcon from '@lucide/svelte/icons/rss';
	import SearchIcon from '@lucide/svelte/icons/search';
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
	import { Button } from '$lib/components/ui/button';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import * as Empty from '$lib/components/ui/empty/index';
	import * as Field from '$lib/components/ui/field/index';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Table from '$lib/components/ui/table/index';
	import { Debouncer } from '$lib/hooks/debounce.svelte';
	import { m } from '$lib/paraglide/messages';
	import { updateColumns, updateRows } from '$lib/remotes/config.remote';

	let {
		columns,
		data,
		limit = 6,
		selected = $bindable(),
		showCreate = $bindable(false),
		showDelete = $bindable(false)
	}: DataTableProps<TData, TValue> = $props();
	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		limit: number;
		selected: null | string;
		showCreate: boolean;
		showDelete: boolean;
	};
	let columnFilters = $state<ColumnFiltersState>([]);

	let rowSelection = $state<RowSelectionState>({});
	let columnVisibility = $state<VisibilityState>({});
	let sortingState = $state<SortingState>([]);
	let paginationState = $derived<PaginationState>({
		pageIndex: 0,
		pageSize: limit
	});

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
		},
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
			case 'actor':
				return m.actor();
			case 'detail':
				return m.details();
			case 'target':
				return m.target();
			case 'timestamp':
				return m.timestamp();
			case 'type':
				return m.type();
		}
	};

	const d = new Debouncer();
</script>

<div class="@container flex w-full grow flex-col divide-y">
	<div class="flex w-full flex-col items-center justify-between @lg:flex-row">
		<div class="flex w-full flex-col items-center px-4 pt-4 @lg:py-4">
			<Field.Field orientation="responsive" class="w-full @2xl:max-w-max me-auto">
				<Field.Label class="sr-only" for="search">{m.search_log()}</Field.Label>
				<InputGroup.Root class="h-8">
					<InputGroup.Addon>
						<SearchIcon class="size-4!" />
					</InputGroup.Addon>
					<InputGroup.Input
						id="search"
						placeholder={m.search_log()}
						class="h-9 w-full @4xl:max-w-sm"
						onchange={(e) => {
							table.setGlobalFilter(e.currentTarget?.value);
						}}
						oninput={(e) => {
							table.setGlobalFilter(e.currentTarget?.value);
						}}
					/>
				</InputGroup.Root>
			</Field.Field>
		</div>

		<DropdownMenu.Root>
			<div class="flex w-full flex-col items-center divide-x @lg:w-max @lg:flex-row @lg:border-s!">
				<div class="flex w-full flex-col p-4 @lg:py-4!">
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" size="sm" class="w-full @lg:w-max">
								<Columns2Icon />
								{m.columns()}
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
				</div>
			</div>
			<DropdownMenu.Content align="end">
				{#each table.getAllColumns().filter((col) => col.getCanHide()) as column (column.id)}
					<DropdownMenu.CheckboxItem
						class="capitalize"
						onCheckedChange={async () => {
							await updateColumns({ columns: columnVisibility, cookie: 'log-columns' });
							await invalidateAll();
						}}
						bind:checked={() => column.getIsVisible(), (v) => column.toggleVisibility(!!v)}
					>
						{getLabel(column.id)}
					</DropdownMenu.CheckboxItem>
				{/each}
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
	<div class="flex h-full w-full flex-col p-4">
		<div class="h-full rounded-md border overflow-y-scroll overflow-clip">
			<Table.Root class="h-full">
				<Table.Header class="sticky top-0 border-b border-border bg-muted z-50">
					{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
						<Table.Row>
							{#each headerGroup.headers as header (header.id)}
								<Table.Head
									colspan={header.colSpan}
									class={[
										['members', 'user'].includes(header.id) && 'w-20!',
										'id' === header.id && 'w-8',
										'name' === header.id && 'w-full',
										'h-12!'
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
						<Table.Row data-state={row.getIsSelected() && 'selected'}>
							{#each row.getVisibleCells() as cell (cell.id)}
								<Table.Cell
									class="h-10 pe-1 {cell.column.id === 'actions' && 'w-10 p-0!'} {cell.column.id ===
										'target' && 'w-full'}"
								>
									<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
								</Table.Cell>
							{/each}
						</Table.Row>
					{/each}

					{#if table.getRowModel().rows.length === 0}
						<Table.Row>
							<Table.Cell colspan={columns.length} class="content-center text-center ">
								<Empty.Root>
									<Empty.Header>
										<Empty.Media variant="icon">
											<RssIcon />
										</Empty.Media>
										<Empty.Title>{m.logs()}</Empty.Title>
										<Empty.Description>
											{m.no_results()}
										</Empty.Description>
									</Empty.Header>
								</Empty.Root>
							</Table.Cell>
						</Table.Row>
					{/if}
					{#if table.getRowModel().rows.length}
						{#each { length: paginationState.pageSize - table.getRowModel().rows.length }, idx (idx)}
							<Table.Row class="h-10">
								<Table.Cell class="py-1" colspan={table.getAllColumns().length}></Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
	<div
		class="@container/buttons flex w-full flex-col flex-wrap @lg:flex-row! @lg:items-center @lg:divide-x"
	>
		<div class="flex px-4 pt-4 @lg:w-full @lg:max-w-max @lg:pb-4">
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
						oninput={(e) => {
							const value = e.currentTarget.value;
							if (!value) return;
							d.debounce(async () => {
								await updateRows({
									cookie: 'log-rows',
									rows: value.toString()
								});
								await invalidateAll();
							}, 500)();
						}}
						value={limit}
					/>
				</InputGroup.Root>
			</Field.Field>
		</div>
		<div class="flex w-full divide-x p-4 @lg:w-max">
			<ButtonGroup.Root class="w-full @lg:w-fit">
				<Button
					class="grow @lg:w-max"
					size="sm"
					variant="outline"
					disabled={!sortingState || sortingState?.length === 0}
					onclick={async () => {
						table.resetColumnFilters();
						table.resetPagination();
						table.resetSorting();
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
	</div>
</div>
