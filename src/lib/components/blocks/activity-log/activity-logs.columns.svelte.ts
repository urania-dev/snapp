import type { ColumnDef } from '@tanstack/table-core';
import type { AdminLogEntry } from '$lib/server/metrics/helpers';

import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import { m } from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { createRawSnippet } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';

import SortButton from '../commons/sort-button.svelte';
import ActivityUser from './activity-user.svelte';
import Code from './log-detail.svelte';

export const columns = [
	
	{
		accessorKey: 'actor',
		cell: ({ row }) => renderComponent(ActivityUser,{
			image:row.original.actor?.image,
			username:row.original.actor?.username,
		}),
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.actor() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},

	{
		accessorKey: 'target',
		cell: ({ row }) => {
			const snippet = createRawSnippet<[{ name: null | string }]>((get) => {
				const { name } = get();
				return {
					render: () => `<span>${name ?? '-'}</span>`
				};
			});
			return renderSnippet(snippet, { name: row.original.target.name });
		},
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.target() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'type',
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.type() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			}),
	},

	
	{
		accessorKey: 'timestamp',
		cell: ({ row }) => {
			const snippet = createRawSnippet<[{ date: Date }]>((get) => {
				const { date } = get();
				const formatted = new SvelteDate(date).toLocaleString(getLocale(), {
					dateStyle: 'medium',
					timeStyle: 'short'
				});
				return {
					render: () => `<span class="pe-2">${formatted}</span>`
				};
			});
			return renderSnippet(snippet, { date: row.original.timestamp });
		},
		header: ({ column }) =>
			renderComponent(SortButton, {
				data: { id: column.id, label: m.timestamp() },
				isAscending: column.getIsSorted() === 'asc',
				isSorting: column.getIsSorted() !== false,
				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'detail',
		cell: ({ row }) => renderComponent(Code,{code: JSON.stringify((row.original.detail), null,2)}),
		enableSorting: false,
		header: () => m.details()
	},


] satisfies ColumnDef<AdminLogEntry>[];
