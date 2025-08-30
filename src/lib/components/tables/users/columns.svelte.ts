import type { Group, User } from "@prisma/client";
import type { ColumnDef } from "@tanstack/table-core";

import { renderComponent, renderSnippet } from "$lib/components/ui/data-table";
import { type TranslationsStoreType } from "$lib/i18n/index.svelte";
import { formatTimeAgo } from "$lib/utils";
import { createRawSnippet } from "svelte";
import { SvelteDate } from "svelte/reactivity";

import Checkbox from "../checkbox.svelte";
import Groups from "./groups.svelte";
import Role from "./role.svelte";
import SortButton from "./sortButton.svelte";

export const columns = (i18n: TranslationsStoreType) => {
	return [
		{
			accessorKey: "id",
			cell: ({ row }) =>
				renderComponent(Checkbox, {
					"aria-label": "Select row",
					checked: row.getIsSelected(),
					onCheckedChange: (value) => row.toggleSelected(!!value)
				}),
			enableHiding: false,
			enableSorting: false,
			header: ({ table }) =>
				renderComponent(Checkbox, {
					"aria-label": "Select all",
					checked: table.getIsAllPageRowsSelected(),
					indeterminate: table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected(),
					onCheckedChange: (value) => table.toggleAllPageRowsSelected(!!value)
				}),
			id: "id"
		},
		{
			accessorKey: "username",
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ id: string; username: string | undefined }]>(
					(getProps) => {
						const { username } = getProps();
						return {
							render: () =>
								`<a href="/users/${username}" class="text-xs flex shrink-0 justify-center font-medium text-muted-foreground hover:text-foreground w-full text-center">${username}</a>`
						};
					}
				);
				return renderSnippet(getContent, {
					id: row.getValue<string>("id"),
					username: row.getValue<string>("username")
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t("users.fields.username")
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === "asc")
				});
			},
			id: "username"
		},
		{
			accessorKey: "groups",
			cell: ({ row }) => renderComponent(Groups, { groups: row.original.groups }),

			enableHiding: true,
			enableSorting: false,
			header: i18n.t("users.groups.label"),
			id: "groups"
		},
		{
			accessorKey: "role",
			cell: ({ row }) => renderComponent(Role, { role: row.original.role }),

			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t("users.fields.role")
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === "asc")
				});
			},
			id: "role"
		},
		{
			accessorKey: "updatedAt",
			cell: ({ row }) => {
				const timesAgo = createRawSnippet<[{ date: string | undefined }]>((getProps) => {
					const { date } = getProps();

					return {
						render: () =>
							(date &&
								`<div class="capitalize whitespace-nowrap w-full text-center">${formatTimeAgo(
									new SvelteDate(date)
								)}</span>`) ||
							`<span></span>`
					};
				});

				return renderSnippet(timesAgo, {
					date: row.getValue<string>("updatedAt")
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t("users.fields.updated")
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === "asc")
				});
			},
			id: "updatedAt"
		},
		{
			accessorKey: "createdAt",
			cell: ({ row }) => {
				const timesAgo = createRawSnippet<[{ date: string | undefined }]>((getProps) => {
					const { date } = getProps();

					return {
						render: () =>
							(date &&
								`<div class="capitalize whitespace-nowrap w-full text-center">${formatTimeAgo(
									new SvelteDate(date)
								)}</span>`) ||
							`<span></span>`
					};
				});

				return renderSnippet(timesAgo, {
					date: row.getValue<string>("createdAt")
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t("snapps.fields.created")
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === "asc")
				});
			},
			id: "createdAt"
		}
	] satisfies ColumnDef<{ groups: Group[] } & User>[];
};
