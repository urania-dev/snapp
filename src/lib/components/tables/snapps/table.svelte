<script lang="ts" generics="TData, TValue">
	import {
		type ColumnDef,
		type ColumnFiltersState,
		type ColumnOrderState,
		getCoreRowModel,
		getPaginationRowModel,
		type RowSelectionState,
		type SortingState,
		type VisibilityState
	} from '@tanstack/table-core';
	import { applyAction, enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { createSvelteTable, FlexRender } from '$lib/components/ui/data-table';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Table from '$lib/components/ui/table';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { Debouncer } from '$lib/stores/debounce.svelte';
	import { LocalStorage } from '$lib/stores/storage.svelte';
	import { cn } from '$lib/utils';
	import { tick } from 'svelte';
	import { queryParameters, ssp } from 'sveltekit-search-params';
	import { createSwapy, type Swapy } from 'swapy';
	const debouncer = new Debouncer();
	type DataTableProps<TData, TValue> = {
		columns: ColumnDef<TData, TValue>[];
		data: TData[];
		isPrivate?: boolean;
		limit: number;
		page: number;
		pageCount: number;
		rowCount: number;
		tableHeightRem?:number
	};
	let {
		columns,
		data = $bindable(),
		isPrivate = true,
		limit = $bindable(),
		pageCount = $bindable(),
		rowCount = $bindable(),
		tableHeightRem=25
	}: DataTableProps<TData, TValue> = $props();

	const params = queryParameters(
		{
			limit: ssp.number(limit),
			page: ssp.number(0),
			query: true,
			sorting: {
				decode: (string: null | string) => (string ? JSON.parse(string) : []) as SortingState,
				defaultValue: [],
				encode: (state: SortingState) => JSON.stringify(state)
			},
			tag: true
		},
		{
			debounceHistory: 1000,
			showDefaults: false
		}
	);
	let rowSelection = $state<RowSelectionState>({});
	let columnFilters = $state<ColumnFiltersState>([]);

	const columnOrder = new LocalStorage<ColumnOrderState>('snappscolumnsorder', []);
	const columnVisibility = new LocalStorage<VisibilityState>('snappscolumns', {});

	const table = createSvelteTable({
		columns,
		get data() {
			return data;
		},
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		manualPagination: true,
		onColumnFiltersChange: (updater) => {
			if (typeof updater === 'function') {
				columnFilters = updater(columnFilters);
			} else {
				columnFilters = updater;
			}
		},
		onColumnOrderChange: (updater) => {
			if (typeof updater === 'function') {
				columnOrder.current = updater(columnOrder.current);
			} else {
				columnOrder.current = updater;
			}
		},
		onColumnVisibilityChange: (updater) => {
			if (typeof updater === 'function') {
				columnVisibility.current = updater(columnVisibility.current);
			} else {
				columnVisibility.current = updater;
			}
		},
		onPaginationChange: (updater) => {
			if (typeof updater === 'function') {
				const pagination = updater({
					pageIndex: params.page,
					pageSize: params.limit
				});
				params.page = pagination.pageIndex;
				params.limit = pagination.pageSize;
			} else {
				params.page = updater.pageIndex;
				params.limit = updater.pageSize;
			}
		},
		onRowSelectionChange: (updater) => {
			if (typeof updater === 'function') {
				rowSelection = updater(rowSelection);
			} else {
				rowSelection = updater;
			}
		},
		onSortingChange: (updater) => {
			if (typeof updater === 'function') {
				params.sorting = updater(params.sorting);
			} else {
				params.sorting = updater;
			}
		},
		pageCount: pageCount,
		rowCount: rowCount,
		state: {
			get columnFilters() {
				return columnFilters;
			},
			get columnOrder() {
				return columnOrder.current;
			},
			get columnVisibility() {
				return columnVisibility.current;
			},
			get pagination() {
				return { pageIndex: params.page, pageSize: params.limit };
			},
			get rowSelection() {
				return rowSelection;
			},
			get sorting() {
				return params.sorting;
			}
		}
	});

	const getColumnI18n = (id: string) => {
		switch (id) {
			case 'createdAt':
				return i18n.t(`snapps.fields.created`);
			case 'disabled':
				return i18n.t(`snapps.fields.status`);
			case 'expiration':
				return i18n.t(`snapps.fields.expiration`);
			case 'hit':
				return i18n.t(`snapps.fields.hit`);
			case 'maxUsages':
				return i18n.t(`snapps.fields.max-usages`);
			case 'originalUrl':
				return i18n.t(`snapps.fields.original-url`);
			case 'secret':
				return i18n.t(`snapps.fields.secret`);
			case 'shortcode':
				return i18n.t(`snapps.fields.shortcode`);
			case 'tag':
				return i18n.t(`menu.tags`);
			case 'used':
				return i18n.t(`snapps.fields.used`);
		}
	};
	const selected_count = $derived(table.getFilteredSelectedRowModel().rows.length);

	const i18n = getTranslations();
	let deleteDialogOpen = $state(false);
	let rearrange = $state(false);
	let swapy = $state<Swapy>();
	let swapyContainer = $state<HTMLElement>();

	const initSwapy = () => {
		if (!swapyContainer) return;
		swapy = createSwapy(swapyContainer, { swapMode: 'hover' });
		swapy.onSwapEnd(({ slotItemMap }) => {
			columnOrder.current = ['id', ...slotItemMap.asArray.map((s) => s.item), 'actions'];
		});
	};

	$effect(() => {
		return () => {
			swapy?.destroy?.();
		};
	});

	const sourceVisible = $derived(table.getAllColumns().filter((col) => col.id ==='originalUrl')?.[0]?.getIsVisible() )
</script>

<div class="flex items-center gap-2 px-4 pb-2">
	<div class="flex items-center gap-2 rounded-sm border ps-2">
		<Input
			icon="magnifying-glass"
			title={i18n.t('snapps.placeholders.search')}
			placeholder={i18n.t('snapps.placeholders.search')}
			bind:value={params['query']}
			class=" cursor-text text-ellipsis p-2 text-start shadow-none"
			container="!border-none focus-within:!ring-0 focus-within:!ring-offset-0 focus-within:!ring-transparent focus-within:!border-transparent focus-within:!outline-transparent"
		/>
	</div>
	<DropdownMenu.Root
	
		onOpenChange={(open) => {
			if (open === false) {
				rearrange = false;
				swapy?.destroy();
			}
		}}
	>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="outline" class="ml-auto text-xs">
					<i class="ph-duotone ph-table text-xl"></i>
					<span>
						{i18n.t('snapps.labels.columns')}
					</span>
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end">
			{#if rearrange}
				<DropdownMenu.DropdownMenuLabel
					>{i18n.t('globals.rearrange')}</DropdownMenu.DropdownMenuLabel
				>
				<DropdownMenu.Separator />
				<div bind:this={swapyContainer} id="swapy-container">
					{#each table
						.getAllColumns()
						.filter((col) => !['actions', 'id'].includes(col.id)) as column, idx (column.id)}
						<div data-swapy-slot={idx}>
							<div data-swapy-item={column.id} class="hover:cursor-grab active:cursor-grabbing">
								<DropdownMenu.DropdownMenuItem class="ps-1" closeOnSelect={false} disabled>
									<i class="ph ph-dots-six text-[20px]"></i>
									<span>
										{getColumnI18n(column.id)}
									</span>
								</DropdownMenu.DropdownMenuItem>
							</div>
						</div>
					{/each}
				</div>{:else}
				<DropdownMenu.DropdownMenuLabel>{i18n.t('globals.show')}</DropdownMenu.DropdownMenuLabel>
				<DropdownMenu.Separator />
				{#each table.getAllColumns().filter((col) => col.getCanHide()) as column (column.id)}
					<DropdownMenu.CheckboxItem
						id={column.id}
						class="capitalize"
						checked={column.getIsVisible()}
						onCheckedChange={(value) => column.toggleVisibility(!!value)}
					>
						{getColumnI18n(column.id)}
					</DropdownMenu.CheckboxItem>
				{/each}
			{/if}
			<DropdownMenu.Separator />

			<DropdownMenu.DropdownMenuItem
				closeOnSelect={false}
				onclick={() => {
					rearrange = !rearrange;
					if (rearrange) tick().then(initSwapy);
					else tick().then(swapy?.destroy);
				}}
				>{i18n.t(
					rearrange ? 'globals.confirm' : 'globals.rearrange'
				)}</DropdownMenu.DropdownMenuItem
			>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>

<div class="mx-auto mt-2 flex w-[calc(100%_-_2rem)] flex-col overflow-hidden rounded-sm border">
	<Table.Root class="w-full">
		<Table.Header class="bg-muted">
			{#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
				<Table.Row>
					{#each headerGroup.headers as header (header.id)}
						<Table.Head
							class={cn(
								'w-24 max-w-24',
								['originalUrl'].includes(header.id) && '!w-full min-w-32 text-center',
								['shortcode'].includes(header.id) && 'pe-2 min-w-auto max-w-auto !w-32 text-center',
								['createdAt'].includes(header.id) && 'w-24 min-w-max text-center',
								['hit', 'maxUsages'].includes(header.id) && 'justify-center !w-max text-center',
								['expiresAt', 'secret'].includes(header.id) && 'w-auto text-center',
								header.id === 'id' && '!w-8 min-w-8',
								header.id==='actions' && "!w-full"
							)}
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
			{#key data}
				{#each table.getRowModel().rows as row (row.id)}
					<Table.Row data-state={row.getIsSelected() && 'selected'} idx={row.index}>
						{#each row.getVisibleCells() as cell (cell.id)}
							<Table.Cell
								class={cn(
									'align-center',
									['expiration', 'secret'].includes(cell.column.id) && '!p-0',
									['hit', 'maxUsages'].includes(cell.column.id) && 'text-center'
								)}
							>
								<FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
							</Table.Cell>
						{/each}
					</Table.Row>
				{:else}
					<Table.Row style="height:calc(100dvh - {tableHeightRem}rem)">
						<Table.Cell colspan={columns.length} class="text-center content-center">
							<div class="flex gap-2 justify-center items-center">
								<i class="ph ph-question text-xl"></i>
								<b> ... </b>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			{/key}
		</Table.Body>
	</Table.Root>
	<Separator class="mt-auto" />
	<div class="flex max-h-max items-center justify-end space-x-2 p-2">
		<div class="me-auto flex items-center gap-5">
			<div class="flex h-10 max-w-max items-center rounded-sm border">
				<div class="flex h-10 w-10 max-w-10 items-center justify-center">
					<i class="ph ph-rows text-[20px]"></i>
				</div>
				<Input
					oninput={(e) => {
						const value = e.currentTarget.value;
						debouncer.debounce(() => {
							params.limit = parseInt(value);
						}, 1000)();
					}}
					value={params.limit}
					class="cursor-text p-2 text-end shadow-none"
					container="border-0 p-1 max-w-12 rounded-none !border-l focus-within:!border-l focus-within:!ring-0 focus-within:!ring-offset-0 focus-within:!ring-transparent focus-within:!border-trb-transparent focus-within:!outline-transparent"
				/>
			</div>
			<small class="text-muted-foreground">( {rowCount} ) {i18n.t('globals.total')}</small>
		</div>
		<Button
			variant="outline"
			size="icon"
			onclick={() => table.previousPage()}
			disabled={!table.getCanPreviousPage()}
		>
			<i class="ph ph-caret-left text-[24px]"></i>
		</Button>
		<Button
			variant="outline"
			size="icon"
			onclick={() => table.nextPage()}
			disabled={!table.getCanNextPage()}
		>
			<i class="ph ph-caret-right text-[24px]"></i>
		</Button>
	</div>
</div>

<Dialog.Root bind:open={deleteDialogOpen}>
	<div class="mt-4 flex w-full flex-row justify-between px-4">
		<Button
			variant="outline"
			disabled={params['query'] === null && params.tag === null && params['sorting']?.length === 0}
			onclick={() => {
				params['query'] = null;
				params.tag = null;
				// remove params from url
				params.page = null as unknown as number;
				params['sorting'] = null as unknown as SortingState;
			}}
		>
			<i class="ph ph-funnel-x text-xl"></i>
			{i18n.t('globals.remove-filters')}
		</Button>
		{#if isPrivate}
			<Dialog.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="outline"
						class="text-sm hover:bg-destructive"
						disabled={selected_count === 0}
					>
						<i class="ph ph-trash text-xl"></i>
						<span>
							{i18n.t('globals.delete')}
							({selected_count})</span
						>
					</Button>
				{/snippet}
			</Dialog.Trigger>
		{/if}
	</div>
	{#if isPrivate}
		<Dialog.Content class="max-w-sm">
			<Dialog.Header>
				<Dialog.Title>
					{i18n.t('globals.sure-ask')}
				</Dialog.Title>
				<Dialog.Description class="text-balance">
					{i18n.t('snapps.actions.confirm-delete')}
				</Dialog.Description>
			</Dialog.Header>
			<div class="flex w-full justify-between gap-4">
				<Dialog.Close class={buttonVariants({ class: 'w-full', variant: 'outline' })}>
					{i18n.t('globals.cancel')}
				</Dialog.Close>
				<form
					action="/dashboard/?/delete"
					method="post"
					class="contents"
					use:enhance={({ formData }) => {
						table
							.getFilteredSelectedRowModel()
							.rows.map((r) => formData.append('ids[]', (r.original as { id: string }).id));
						return async ({ result }) => {
							await applyAction(result);
							await invalidateAll();
							deleteDialogOpen = false;
						};
					}}
				>
					<Button variant="destructive" type="submit" class="w-full">
						{i18n.t('globals.confirm')}
					</Button>
				</form>
			</div>
		</Dialog.Content>
	{/if}
</Dialog.Root>
