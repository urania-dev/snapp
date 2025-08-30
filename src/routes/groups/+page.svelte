<script lang="ts">
	import CreateGroup from "$lib/components/groups/createGroup.svelte";
	import { columns } from "$lib/components/tables/groups/columns.svelte";
	import DataTable from "$lib/components/tables/groups/table.svelte";
	import H2 from "$lib/components/typography/heading/h2.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator";
	import { getTranslations } from "$lib/i18n/index.svelte";
	const { data } = $props();
	const i18n = getTranslations();
	import SvelteSeo from "svelte-seo";

	let createDialog = $state(false);
</script>

<div class="flex w-full flex-col">
	<div class="flex w-full items-center justify-between px-4">
		<div class="flex h-20 w-full items-center gap-2">
			<i class="ph-duotone ph-chats text-[32px]"></i>
			<H2 class="m-0 p-0">{i18n.t("menu.groups")}</H2>
		</div>
		{#if data.user.role !== "user"}
			<Button
				onclick={() => {
					createDialog = !createDialog;
				}}
			>
				<i class="ph-bold ph-plus"></i>
				<span class="hidden md:block">
					{i18n.t("users.groups.labels.create")}
				</span>
			</Button>
		{/if}
	</div>
	<Separator />
</div>
<div class="flex w-full flex-col pt-4">
	<DataTable
		isPrivate={data.user.role !== "user" || false}
		limit={data.limit}
		columns={columns(i18n, data.user)}
		data={data.groups}
		rowCount={data.rowCount}
		pageCount={data.pageCount}
		page={Math.floor(parseInt(data.page))}
	></DataTable>
</div>

{#if data.user.role !== "user"}
	<CreateGroup createForm={data.createForm} bind:open={createDialog} />
{/if}
<SvelteSeo title={`${data.appname || "Snapp"} | ${i18n.t("menu.groups")}`} />
