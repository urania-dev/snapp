import type { Group, Snapp, User } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';

import Actions from '$lib/components/tables/groups/actions.svelte';
import SortButton from '$lib/components/tables/groups/sortButton.svelte';
import { Checkbox } from '$lib/components/ui/checkbox';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import { type TranslationsStoreType } from '$lib/i18n/index.svelte';
import { createRawSnippet } from 'svelte';

export const columns = (i18n: TranslationsStoreType, user: User) => {
	return [
		{
			accessorKey: 'id',
			cell: ({ row }) =>
				renderComponent(Checkbox, {
					'aria-label': 'Select row',
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value)
				}),
			enableHiding: false,
			enableSorting: false,
			header: ({ table }) =>
				renderComponent(Checkbox, {
					'aria-label': 'Select all',
					checked: table.getIsAllPageRowsSelected(),
					indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value)
				}),
			id: 'id'
		},
		{
			accessorKey: 'name',
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ name: string | undefined; slug: string }]>(
					(getProps) => {
						const { name, slug } = getProps();
						return {
							render: () =>
								`<a href="/groups/${slug}" class="flex shrink-0 justify-center font-medium text-foreground-muted hover:text-foreground w-full text-center">${name}</a>`
						};
					}
				);
				return renderSnippet(getContent, {
					name: row.getValue<string>('name'),
					slug: row.getValue<string>('slug')
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t('users.groups.labels.name')
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === 'asc')
				});
			},
			id: 'name'
		},
		{
			accessorKey: 'slug',
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ slug: string | undefined }]>((getProps) => {
					const { slug } = getProps();
					return {
						render: () =>
							`<a href="/groups/${slug}" class="text-xs flex shrink-0 uppercase justify-center font-medium hover:text-foreground w-full text-center">${slug}</a>`
					};
				});
				return renderSnippet(getContent, {
					slug: row.getValue<string>('slug')
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t('tags.labels.slug')
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === 'asc')
				});
			},
			id: 'slug'
		},
		{
			accessorKey: 'snapps',
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ count: number | undefined }]>((getProps) => {
					const { count } = getProps();
					return {
						render: () =>
							`<span class="w-full text-center flex justify-center text-muted-foreground">${count}</span>`
					};
				});
				return renderSnippet(getContent, { count: row.original._count.snapps });
			},
			enableHiding: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t('users.groups.labels.urls')
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === 'asc')
				});
			},
			id: 'snapps'
		},
		{
			accessorKey: 'users',
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ count: number | undefined }]>((getProps) => {
					const { count } = getProps();
					return {
						render: () =>
							`<span class="w-full text-center flex justify-center text-muted-foreground">${count}</span>`
					};
				});
				return renderSnippet(getContent, { count: row.original._count.users });
			},
			enableHiding: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t('users.groups.labels.members')
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === 'asc')
				});
			},
			id: 'users'
		},
		{
			accessorKey: 'actions',
			cell: ({ row }) => renderComponent(Actions, { group: row.original, user }),
			enableHiding: false,
			enableSorting: false,
			header: '',
			id: 'actions'
		}
	] satisfies ColumnDef<{ _count: { snapps: number; users: number }; snapps: Snapp[] } & Group>[];
};
