<script lang="ts">
	import type { Snapp, Tag } from "@prisma/client";

	import { browser } from "$app/environment";
	import { columns } from "$lib/components/tables/snapps/columns.svelte";
	import DataTable from "$lib/components/tables/snapps/table.svelte";
	import H2 from "$lib/components/typography/heading/h2.svelte";
	import { Button } from "$lib/components/ui/button";
	import { Separator } from "$lib/components/ui/separator";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { decode } from "html-entities";
	import SvelteSeo from "svelte-seo";
	import { toast } from "svelte-sonner";
	const { data, form } = $props();
	const i18n = getTranslations();

	interface SnappWithTags extends Snapp {
		tag: Tag[];
	}

	$effect(() => {
		if (form?.message && browser) {
			toast.info(decode(i18n.t(form.message)));
		}
	});
</script>

<div class="flex w-full flex-col">
	<div class="flex w-full items-center justify-between px-4">
		<div class="flex h-20 w-full items-center gap-2">
			<i class="ph-duotone ph-link-simple text-[32px]"></i>
			<H2 class="m-0 p-0">{i18n.t("snapps.label")}</H2>
		</div>
		<Button href="/dashboard/shorten">
			<i class="ph-bold ph-plus"></i>
			<span class="hidden md:block">
				{i18n.t("snapps.labels.create")}
			</span>
		</Button>
	</div>
	<Separator />
</div>
<div class="flex w-full flex-col pt-4">
	<DataTable
		limit={data.limit}
		columns={columns(i18n)}
		data={data?.snapps as SnappWithTags[]}
		rowCount={data.rowCount}
		pageCount={data.pageCount}
		page={Math.floor(parseInt(data.page))}
	></DataTable>
</div>

<SvelteSeo title={`${data.appname || "Snapp"} | ${i18n.t("menu.dashboard")}`} />
