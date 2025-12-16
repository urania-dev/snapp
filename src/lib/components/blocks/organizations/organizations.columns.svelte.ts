import type { ColumnDef } from '@tanstack/table-core';
import type { AuthInstance } from '$lib/auth/server';
import type { TPermissions } from '$lib/schemas/host.schema';

import TableCheckbox from '$lib/components/blocks/commons/checkbox.svelte';
import TableOrgsAction from '$lib/components/blocks/organizations/table-orgs-action.svelte';
import TableSortButton from '$lib/components/blocks/organizations/table-sort-button.svelte';
import { renderComponent, renderSnippet } from '$lib/components/ui/data-table';
import { m } from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { createRawSnippet } from 'svelte';
import { SvelteDate } from 'svelte/reactivity';

import OrganizationNameInput from './organization-name-input.svelte';

export type Organization = {
	invitations: Invitation[];
	member: {
		createdAt: Date;
		id: string;
		organizationId: string;
		role: string;
		userId: string;
	} | undefined;
	members: Member[];
	permissions: Record<string, TPermissions>;
	roles: {
		createdAt: Date;
		id: string;
		organizationId: string;
		permission: string;
		role: string;
		updatedAt: Date | null;
	}[]
	teams: Team[];
} & Awaited<ReturnType<AuthInstance['api']['listOrganizations']>>[number];

type Invitation = Awaited<ReturnType<AuthInstance['api']['listInvitations']>>[number];

type Member = Awaited<ReturnType<AuthInstance['api']['listMembers']>>['members'][number];

type Team = {
	memberCount: number;
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
		cell:({row})=>renderComponent(OrganizationNameInput, {
			organizationId: row.original.id,
			originalName: row.original.name,
			}),
		header: ({ column }) =>
			renderComponent(TableSortButton, {
				data: { id: column.id, label: m.name() },

				onclick: () => column.toggleSorting()
			}),

	},
	{
		accessorKey: 'slug',
		header: ({ column }) =>
			renderComponent(TableSortButton, {
				data: { id: column.id, label: m.slug() },

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
		accessorKey: 'teams',
		cell: ({ row }) => {
			const countCellSnippet = createRawSnippet<[{ count: null | number }]>((getAmount) => {
				const { count } = getAmount();
				return {
					render: () => `<div class="pe-7 w-full">${count}</div>`
				};
			});

			return renderSnippet(countCellSnippet, {
				count: row.original.teams.length
			});
		},
		header: ({ column }) =>
			renderComponent(TableSortButton, {
				data: { id: column.id, label: m.teams() },

				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'members',
		cell: ({ row }) => {
			const countCellSnippet = createRawSnippet<[{ count: null | number }]>((getAmount) => {
				const { count } = getAmount();
				return {
					render: () => `<div class="pe-7 w-full">${count}</div>`
				};
			});

			return renderSnippet(countCellSnippet, {
				count: row.original.members.length
			});
		},
		header: ({ column }) =>
			renderComponent(TableSortButton, {
				class: 'justify-start',
				data: { id: column.id, label: m.members() },

				onclick: () => column.toggleSorting()
			})
	},
	{
		accessorKey: 'actions',
		cell: ({ row }) =>
			renderComponent(TableOrgsAction, {
				origin: JSON.parse(row.original.metadata || '{}')?.origin,
			}),
		enableHiding: false,
		enableSorting: false,
		header: undefined
	}
] satisfies ColumnDef<Organization>[];
