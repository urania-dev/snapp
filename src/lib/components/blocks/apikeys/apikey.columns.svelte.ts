import type { AuthInstance } from '$lib/auth/server';

import { type ColumnDef } from '@tanstack/table-core';
import TableCheckbox from '$lib/components/blocks/commons/checkbox.svelte';
import SortButton from '$lib/components/blocks/commons/sort-button.svelte';
import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import { m } from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { createRawSnippet } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';
export type ApiKey = Awaited<ReturnType<AuthInstance['api']['listApiKeys']>>[number];
export const columns: ColumnDef<ApiKey>[] = [
	{
		accessorKey: 'id',
		cell: ({ row, table }) =>
			renderComponent(TableCheckbox, {
				'aria-label': m.select(),
				checked: row.getIsSelected(),
				onCheckedChange: (value) => {
					table.resetRowSelection();
					setTimeout(() => {
						row.toggleSelected(value);
					}, 5);
				}
			}),
		enableHiding: false,
		enableSorting: false,
		header: ({ table }) =>
			renderComponent(Checkbox, {
				'aria-label': m.select_all(),
				checked: table.getIsAllPageRowsSelected(),
				indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
				onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value)
			})
	},
	{
		accessorKey: 'name',
		cell: ({ row }) => row.original.name,
		header: m.name()
	},
	{
		accessorKey: 'start',
		cell: ({ row }) => `${row.original.start}***`,
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.api_key() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: typeof column.getIsSorted() === 'string',
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'createdAt',
		cell: ({ row }) => {
			const dateSnippet = createRawSnippet<[{ date: Date }]>((get) => {
				const { date } = get();
				const formatted = new SvelteDate(date).toLocaleDateString(getLocale(), {
					dateStyle: 'medium'
				});
				return { render: () => `<span>${formatted}</span>` };
			});
			return renderSnippet(dateSnippet, { date: row.original.createdAt });
		},
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.created_at() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: typeof column.getIsSorted() === 'string',
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'expiresAt',
		cell: ({ row }) => {
			const dateSnippet = createRawSnippet<[{ date: Date | null }]>((get) => {
				const { date } = get();
				const formatted =
					date &&
					new SvelteDate(date).toLocaleDateString(getLocale(), {
						dateStyle: 'medium'
					});
				return { render: () => `<span>${formatted || ''}</span>` };
			});
			return renderSnippet(dateSnippet, { date: row.original.expiresAt });
		},
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.expires_at() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: typeof column.getIsSorted() === 'string',
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'lastRequest',
		cell: ({ row }) => {
			const dateSnippet = createRawSnippet<[{ date: Date | null }]>((get) => {
				const { date } = get();
				const formatted =
					date &&
					new SvelteDate(date).toLocaleDateString(getLocale(), {
						dateStyle: 'medium'
					});
				return { render: () => `<span>${formatted || ''}</span>` };
			});
			return renderSnippet(dateSnippet, { date: row.original.lastRequest });
		},
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.last_request() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: typeof column.getIsSorted() === 'string',
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'enabled',
		cell: ({ row }) =>
			renderComponent(Checkbox, {
				checked: row.original.enabled,
				disabled: true
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.enabled() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: typeof column.getIsSorted() === 'string',
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'rateLimitEnabled',
		cell: ({ row }) =>
			renderComponent(Checkbox, {
				checked: row.original.rateLimitEnabled,
				disabled: true
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.rate_limited() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: typeof column.getIsSorted() === 'string',
				onclick: () => column.toggleSorting()
			})
	}
];
