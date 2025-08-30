<script lang="ts">
	import type { User } from "@prisma/client";

	import P from "$lib/components/typography/text/p.svelte";
	import * as Tabs from "$lib/components/ui/tabs";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { decode } from "html-entities";

	import Export from "./export.svelte";
	import Import from "./import.svelte";

	const i18n = getTranslations();
	const { user }: { user: User } = $props();
	let activeTab = $state("import");
</script>

<div class="grid h-max w-full grid-cols-1 gap-2 md:gap-4">
	<P class="text-sm leading-normal">{@html decode(i18n.t("migrations.helper"))}</P>
	<Tabs.Root bind:value={activeTab} class="mt-4 w-full">
		<Tabs.List>
			<Tabs.Trigger value="import">
				<div class="flex items-center gap-1">
					<i class="ph-duotone ph-file-arrow-up text-[18px]"> </i>

					<span>{@html decode(i18n.t("migrations.import"))}</span>
				</div>
			</Tabs.Trigger>
			<Tabs.Trigger value="export">
				<div class="flex items-center gap-1">
					<i class="ph-duotone ph-file-arrow-down text-[18px]"> </i>
					<span>
						{@html decode(i18n.t("migrations.export"))}
					</span>
				</div>
			</Tabs.Trigger>
		</Tabs.List>
		<Import {user}></Import>
		<Tabs.Content value="export" class="w-full">
			{#if activeTab === "export"}
				<Export />
			{/if}
		</Tabs.Content>
	</Tabs.Root>
</div>
