import type { ColumnDef } from '@tanstack/table-core';
import type { tag, url } from '$lib/server/db/schema';

import LockKeyholeIcon from '@lucide/svelte/icons/lock-keyhole';
import TableCheckbox from '$lib/components/blocks/commons/checkbox.svelte';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import { m } from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { createRawSnippet } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';

import IsEnabledBadge from '../commons/is-enabled-badge.svelte';
import SortButton from '../commons/sort-button.svelte';
import TableActions from '../commons/table-actions.svelte';
import TableGenericBadge from '../commons/table-generic-badge.svelte';
import TableGenericButton from '../commons/table-generic-button.svelte';
import TableGenericIcon from '../commons/table-generic-icon.svelte';
import TableStatusBadge from '../commons/table-status-badge.svelte';

type Tag = typeof tag.$inferSelect;
type URLs = { secret: boolean; tags: Tag[] } & Omit<typeof url.$inferSelect, 'secret'>;

export const columns : ColumnDef<URLs>[]= [
	{
		accessorKey: 'id',
		cell: ({ row, table }) => {
			return renderComponent(TableCheckbox, {
				'aria-label': m.select(),
				checked: row.getIsSelected(),
				onCheckedChange: (value) => {
					table.resetRowSelection();
					setTimeout(() => {
						row.toggleSelected(value);
					}, 5);
				}
			});
		},
		enableHiding: false,
		enableSorting: false,
		header: ({ table }) =>
			renderComponent(TableCheckbox, {
				'aria-label': m.select_all(),
				checked: table.getIsAllPageRowsSelected(),
				indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
				onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value)
			})
	},
	{
		accessorKey: 'shortcode',
		cell: ({ row }) =>
			renderComponent(TableGenericButton, {
				class: 'px-0 text-inherit w-full justify-start h-full hover:text-sidebar-primary! duration-50',
				href: `/urls/${row.original.id}`,
				label: row.original.shortcode,
				variant: 'link'
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.shortcode() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'originalUrl',
		cell: ({ row }) =>
			renderComponent(TableGenericButton, {
				class: 'px-0 text-inherit font-normal w-full justify-start h-full hover:text-sidebar-primary! duration-50',
				href: row.original.originalUrl,
				label: row.original.originalUrl,
				variant: 'link'
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.original_url() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'createdAt',
		cell: ({ row }) => {
			const dateCellSnippet = createRawSnippet<[{ date: Date | string }]>((getAmount) => {
				const { date } = getAmount();
				const formatted = new SvelteDate(date).toLocaleDateString(getLocale(), {
					dateStyle: 'medium'
				});
				return {
					render: () => `<span>${formatted}</span>`
				};
			});

			return renderSnippet(dateCellSnippet, {
				date: row.original.createdAt
			});
		},
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.created_at() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'updatedAt',
		cell: ({ row }) => {
			const dateCellSnippet = createRawSnippet<[{ date: Date | string }]>((getAmount) => {
				const { date } = getAmount();
				const formatted = new SvelteDate(date).toLocaleDateString(getLocale(), {
					dateStyle: 'medium'
				});
				return {
					render: () => `<span>${formatted}</span>`
				};
			});

			return renderSnippet(dateCellSnippet, {
				date: row.original.updatedAt
			});
		},
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.updated_at() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'expiresAt',
		cell: ({ row }) => {
			const dateCellSnippet = createRawSnippet<[{ date?: Date | null }]>((getAmount) => {
				const { date } = getAmount();
				const formatted =
					(date &&
						new SvelteDate(date).toLocaleDateString(getLocale(), {
							dateStyle: 'medium'
						})) ||
					null;
				return {
					render: () => `<span>${formatted ?? ''}</span>`
				};
			});

			return renderSnippet(dateCellSnippet, {
				date: row.original.expiresAt
			});
		},
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.expires_at() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'enabled',
		cell: ({ row }) =>
			renderComponent(IsEnabledBadge, {
				enabled: row.original.active
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.enabled() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'secret',
		cell: ({ row }) =>
			renderComponent(TableGenericIcon, {
				disabled: !row.original.secret,
				Icon: LockKeyholeIcon,
				iconClass: row.original.secret ? 'opacity-100' : 'opacity-20',
				message: m.url_is_secret(),
				variant: 'ghost'
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.secret() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'hit',
		cell: ({ row }) =>
			renderComponent(TableGenericBadge, {
				label: row.original.hit?.toString() || '',
				variant: 'outline'
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.hit() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'limit',
		cell: ({ row }) =>
			renderComponent(TableGenericBadge, {
				label: row.original.limit > -1 ? row.original.limit?.toString() : '',
				variant: row.original.limit > -1 ? 'outline' : 'ghost'
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.limits() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'status',
		cell: ({ row }) =>
			renderComponent(TableStatusBadge, {
				status: row.original.status
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.status() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'utm',
		cell: ({ row }) =>
			renderComponent(TableGenericBadge, {
				label: Object.entries(row.original.utm || {}).length?.toString() || '&nbsp;',
				variant: 'outline'
			}),
		enableSorting: false,
		header: m.utm()
	},
	{
		accessorKey: 'actions',

		cell: ({ row }) =>
			renderComponent(TableActions, {
				id: row.original.id
			}),
		enableHiding: false,
		enableSorting: false,
		header: '',
		id: 'actions'
	}
] ;
