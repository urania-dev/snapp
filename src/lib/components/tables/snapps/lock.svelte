<script lang="ts">
	import { buttonVariants } from "$lib/components/ui/button";
	import * as Tooltip from "$lib/components/ui/tooltip";
	import { getTranslations } from "$lib/i18n/index.svelte";
	import { cn } from "$lib/utils";

	const { secret }: { secret: null | string } = $props();

	const i18n = getTranslations();
	let openTooltip = $state(false);
</script>

<div class="flex w-full justify-center">
	<Tooltip.Provider>
		<Tooltip.Root bind:open={openTooltip}>
			<Tooltip.Trigger
				class={cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 disabled:opacity-25")}
				disabled={secret === null}
				onmouseleave={() => {
					setTimeout(() => {
						if (openTooltip) openTooltip = false;
					}, 500);
				}}
			>
				<i class="ph-duotone ph-lock text-[20px]"></i>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>{i18n.t("snapps.helpers.secret")}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
</div>
