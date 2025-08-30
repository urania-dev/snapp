import type { Tag } from "@prisma/client";
import type { ColumnDef } from "@tanstack/table-core";

import { renderComponent, renderSnippet } from "$lib/components/ui/data-table";
import { type TranslationsStoreType } from "$lib/i18n/index.svelte";
import { createRawSnippet } from "svelte";

import Checkbox from "../checkbox.svelte";
import Actions from "./actions.svelte";
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
			accessorKey: "name",
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ id: string; name: string | undefined }]>(
					(getProps) => {
						const { name } = getProps();
						return {
							render: () =>
								`<span class="text-sm flex shrink-0 capitalize justify-center font-medium text-muted-foreground hover:text-foreground w-full text-center">${name}</span>`
						};
					}
				);
				return renderSnippet(getContent, {
					id: row.getValue<string>("id"),
					name: row.getValue<string>("name")
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t("tags.labels.name")
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === "asc")
				});
			},
			id: "name"
		},
		{
			accessorKey: "slug",
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ slug: string | undefined }]>((getProps) => {
					const { slug } = getProps();
					return {
						render: () =>
							`<a href="/dashboard/?tag=${slug}" class="text-xs flex shrink-0 justify-center font-medium  hover:text-foreground w-full text-center">${slug}</a>`
					};
				});
				return renderSnippet(getContent, {
					slug: row.getValue<string>("slug")
				});
			},
			enableHiding: true,
			enableSorting: true,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t("tags.labels.slug")
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === "asc")
				});
			},
			id: "slug"
		},
		{
			accessorKey: "_count",
			cell: ({ row }) => {
				const getContent = createRawSnippet<[{ count: number | undefined }]>((getProps) => {
					const { count } = getProps();
					return {
						render: () =>
							`<span class="w-full  text-muted-foreground text-center flex justify-center">${count}</span>`
					};
				});
				return renderSnippet(getContent, { count: row.original._count.snapps });
			},
			enableHiding: false,
			header: ({ column }) => {
				return renderComponent(SortButton, {
					data: {
						id: column.id,
						label: i18n.t("globals.count")
					},
					onclick: () => column.toggleSorting(column.getIsSorted() === "asc")
				});
			},
			id: "_count"
		},
		{
			accessorKey: "actions",
			cell: ({ row }) => renderComponent(Actions, { tag: row.original }),
			enableHiding: false,
			enableSorting: false,
			header: "",
			id: "actions"
		}
	] satisfies ColumnDef<{ _count: { snapps: number } } & Tag>[];
};
