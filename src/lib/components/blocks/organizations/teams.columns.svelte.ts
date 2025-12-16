import type { ColumnDef } from '@tanstack/table-core';
import type { AuthInstance } from '$lib/auth/server';

import TableCheckbox from '$lib/components/blocks/commons/checkbox.svelte';
import TableSortButton from '$lib/components/blocks/organizations/table-sort-button.svelte';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import { m } from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { createRawSnippet } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';

import TableGenericButton from '../commons/table-generic-button.svelte';

type Team = {
	createdAt: Date;
	id: string;
	name: string;
	updatedAt?: Date;
} & Awaited<ReturnType<AuthInstance['api']['listOrganizationTeams']>>[number];

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
		accessorKey: 'name',
		cell: ({ row }) =>
			renderComponent(TableGenericButton, {
				class: 'px-0 text-inherit w-full justify-start h-full',
				href: `/teams/${row.original.id}`,
				label: row.original.name,
				onclick: (e) => {
					e.stopPropagation();
				},
				variant: 'link'
			}),
		header: ({ column }) =>
			renderComponent(TableSortButton, {
				data: { id: column.id, label: m.name() },

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
			renderComponent(TableSortButton, {
				data: { id: column.id, label: m.created_at() },

				onclick: () => column.toggleSorting()
			})
	},

	{
		accessorKey: 'updatedAt',
		cell: ({ row }) => {
			const dateCellSnippet = createRawSnippet<[{ date?: Date | string }]>((getAmount) => {
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
			renderComponent(TableSortButton, {
				data: { id: column.id, label: m.updated_at() },

				onclick: () => column.toggleSorting()
			})
	}
] satisfies ColumnDef<Team>[];
