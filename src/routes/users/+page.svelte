<script lang="ts">
	import { columns } from "$lib/components/tables/users/columns.svelte";
	import CreateUser from "$lib/components/tables/users/createUser.svelte";
	import DataTable from "$lib/components/tables/users/table.svelte";
	import H2 from "$lib/components/typography/heading/h2.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import SvelteSeo from "svelte-seo";

	const { data } = $props();
	const i18n = getTranslations();

	let createDialog = $state(false);
</script>

<div class="flex w-full flex-col">
	<div class="flex w-full items-center justify-between px-4">
		<div class="flex h-20 w-full items-center gap-2">
			<i class="ph-duotone ph-users text-[32px]"></i>
			<H2 class="m-0 p-0">{i18n.t("menu.users")}</H2>
		</div>
		<Button
			onclick={() => {
				createDialog = !createDialog;
			}}
		>
			<i class="ph-duotone ph-user-plus text-[22px]"></i>
			<span class="hidden md:block">
				{i18n.t("users.labels.create")}
			</span>
		</Button>
	</div>
	<Separator />
</div>
<div class="flex w-full flex-col pt-4">
	<DataTable
		limit={data.limit}
		columns={columns(i18n)}
		data={data.users}
		rowCount={data.rowCount}
		pageCount={data.pageCount}
		page={Math.floor(parseInt(data.page))}
	></DataTable>
</div>

<CreateUser createForm={data.createForm} bind:open={createDialog} />

<SvelteSeo title={`${data.appname || "Snapp"} | ${i18n.t("menu.users")}`} />
