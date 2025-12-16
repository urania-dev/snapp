import type { ColumnDef } from '@tanstack/table-core';

import TableCheckbox from '$lib/components/blocks/commons/checkbox.svelte';
import TableRoleBadge from '$lib/components/blocks/commons/table-role-badge.svelte';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import { m } from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { createRawSnippet } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';

import SortButton from '../commons/sort-button.svelte';
import TableGenericBadge from '../commons/table-generic-badge.svelte';
import TableGenericButton from '../commons/table-generic-button.svelte';
import TableAction from './table-actions.svelte';


export const columns = [
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
		accessorKey: 'username',
		cell: ({ row }) =>
						renderComponent(TableGenericButton, {
							class: 'px-0 text-inherit w-full justify-start h-full',
							href: `/users	/${row.original.id}`,
							label: row.original.username,
							onclick:(e)=>{e.stopPropagation()},
							variant: 'link',
						}),
			header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.username() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			}),
	},
	{
		accessorKey: 'email',
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.email() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'role',
		cell: ({ row }) =>
			renderComponent(TableRoleBadge, {
				class:'font-semibold',
				role: row.original.role || 'user',
			}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.role() },
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
		accessorKey: 'banned',
		cell: ({ row }) => renderComponent(TableGenericBadge, {
			class: 'aspect-auto',
			label: row.original.banned ? m.banned() : m.active(),
			variant:row.original.banned ? 'destructive' : 'outline',
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
			accessorKey: 'actions',
			cell: ({ row }) =>
				renderComponent(TableAction, {
					id: row.original.id
				}),
			enableHiding: false,
			enableSorting: false,
			header: undefined
		}
] satisfies ColumnDef<User>[];
