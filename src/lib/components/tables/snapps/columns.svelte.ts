import type { Snapp, Tag } from '@prisma/client';
import type { ColumnDef } from '@tanstack/table-core';

import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import { type TranslationsStoreType } from '$lib/i18n/index.svelte';
import { formatTimeAgo } from '$lib/utils';
import { createRawSnippet } from 'svelte';

import Checkbox from '../checkbox.svelte';
import Actions from './actions.svelte';
import Expiration from './expiration.svelte';
import Lock from './lock.svelte';
import OriginalUrl from './originalUrl.svelte';
import SortButton from './sortButton.svelte';
import Status from './status.svelte';
import Tags from './tags.svelte';

interface SnappWithTags extends Snapp {
	tag: Tag[];
}

export const columns = (i18n: TranslationsStoreType, isPrivateView: boolean = true) => {
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
			accessorKey: 'createdAt',
			cell: ({ row }) => {
				const timesAgo = createRawSnippet<[{ date: string | undefined }]>((getProps) => {
					const { date } = getProps();

					return {
						render: () =>
							(date &&
								`<div class="text-muted-foreground font-medium whitespace-nowrap w-full text-xs text-center">${formatTimeAgo(
									new Date(date),
									i18n.locale
								)}</span>`) ||
							`<span></span>`
					};
				});

				return renderSnippet(timesAgo, {
					date: row.getValue<string>('createdAt')
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t('snapps.fields.created')
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === 'asc')
				});
			},
			id: 'createdAt'
		},
		{
			accessorKey: 'shortcode',
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ id: string; shortcode: string | undefined }]>(
					(getProps) => {
						const { id, shortcode } = getProps();
						return {
							render: () =>
								isPrivateView
									? `<a href="/dashboard/${id}" class="text-xs flex shrink-0 uppercase justify-center font-medium hover:text-foreground w-full text-center">${shortcode}</a>`
									: `<a href="/${shortcode}" data-sveltekit-preload-data="off" class="text-xs flex shrink-0 uppercase justify-center font-medium hover:text-foreground w-full text-center">${shortcode}</a>`
						};
					}
				);
				return renderSnippet(getContent, {
					id: row.getValue<string>('id'),
					shortcode: row.getValue<string>('shortcode')
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t('snapps.fields.shortcode')
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === 'asc')
				});
			},
			id: 'shortcode'
		},

		{
			accessorKey: 'originalUrl',
			cell: ({ row }) =>
				renderComponent(OriginalUrl, {
					url: row.original.originalUrl
				}),
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: 'snapps.fields.original-url'
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === 'asc')
				});
			},
			id: 'originalUrl'
		},
		{
			accessorKey: 'hit',
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ hit: string | undefined }]>((getProps) => {
					const { hit } = getProps();
					return {
						render: () => `<span class="w-full text-center text-muted-foreground">${hit}</span>`
					};
				});
				return renderSnippet(getContent, { hit: row.getValue<string>('hit') });
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t('snapps.fields.hit')
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === 'asc')
				});
			},
			id: 'hit'
		},
		{
			accessorKey: 'maxUsages',
			cell: ({ row }) => {
				const getContent = createRawSnippet<
					[{ maxUsages: number | undefined; used: number | undefined }]
				>((getProps) => {
					const { maxUsages, used } = getProps();
					return {
						render: () =>
							`<div class="capitalize text-muted-foreground w-full text-center">${
								maxUsages && maxUsages > 0 ? `${used}/${maxUsages}` : '<i class="ph ph-minus"></i>'
							}</div>`
					};
				});
				return renderSnippet(getContent, {
					maxUsages: row.original.maxUsages,
					used: row.original.used
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				const label = i18n.t('snapps.fields.max-usages');
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === 'asc')
				});
			},
			id: 'maxUsages'
		},
		{
			accessorKey: 'disabled',
			cell: ({ row }) =>
				renderComponent(Status, {
					disabled: row.original.disabled
				}),
			enableHiding: true,
			enableSorting: true,
			header: () => {
				const getHeader = createRawSnippet<[]>(() => {
					return {
						render: () =>
							`<div class="capitalize w-full text-center">${i18n.t(`snapps.fields.status`)}</div>`
					};
				});
				return renderSnippet(getHeader, {});
			},
			id: 'disabled'
		},
		{
			accessorKey: 'secret',
			cell: ({ row }) =>
				renderComponent(Lock, {
					secret: row.original.secret
				}),
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				const getHeader = createRawSnippet<[]>(() => {
					return {
						render: () =>
							`<div class="capitalize w-full text-center">${i18n.t(
								`snapps.fields.${column.id}`
							)}</div>`
					};
				});
				return renderSnippet(getHeader, {});
			},
			id: 'secret'
		},
		{
			accessorKey: 'expiration',
			cell: ({ row }) =>
				renderComponent(Expiration, {
					expiresAt: row.original.expiresAt
				}),
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				const getHeader = createRawSnippet<[]>(() => {
					return {
						render: () =>
							`<div class="capitalize w-full text-center">${i18n.t(
								`snapps.fields.${column.id}`
							)}</div>`
					};
				});
				return renderSnippet(getHeader, {});
			},

			id: 'expiration'
		},
		{
			accessorKey: 'tag',
			cell: ({ row }) => renderComponent(Tags, { tags: row.original.tag }),
			header: () => {
				const getHeader = createRawSnippet<[]>(() => {
					return {
						render: () => `<div class="capitalize w-full text-center">${i18n.t(`menu.tags`)}</div>`
					};
				});
				return renderSnippet(getHeader, {});
			},
			id: 'tag'
		},
		{
			accessorKey: 'actions',

			cell: ({ row }) =>
				renderComponent(Actions, {
					isPrivate: isPrivateView,
					snapp: row.original
				}),
			enableHiding: false,
			enableSorting: false,
			header: '',
			id: 'actions'
		}
	] satisfies ColumnDef<SnappWithTags>[];
};
