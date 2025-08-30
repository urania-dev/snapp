<script>
	import { SingleForm } from "$lib/components/snapps";
	import H4 from "$lib/components/typography/heading/h4.svelte";
	import P from "$lib/components/typography/text/p.svelte";
	import * as Card from "$lib/components/ui/card";
	import { getTranslations } from "$lib/i18n/index.svelte";

	let { data } = $props();

	const i18n = getTranslations();
</script>

<div class="flex h-full w-full items-center justify-center">
	<div class="flex h-full w-full items-center justify-between px-4">
		<Card.Root class="m-auto max-w-sm">
			<Card.Header class="flex flex-row items-center gap-2">
				<i
					class="ph ph-{data.isDisabled === true
						? 'link-break'
						: 'detective'} mx-auto aspect-square max-w-max rounded bg-foreground/20 p-2 text-[32px]"
				></i>
				{#if data.isDisabled === true}
					<H4 class="w-full text-balance leading-[1.15]">
						{i18n.t("snapps.helpers.not-found")}
					</H4>
				{:else if data.isDisabled === false && data.hasPassword}
					<H4 class="w-full text-balance leading-[1.15]">
						{i18n.t("snapps.helpers.secret")}
					</H4>
				{/if}
			</Card.Header>
			<Card.Content class="px-3">
				{#if data.isDisabled === false && data.hasPassword && data.form}
					<SingleForm formSchema={data.form} />
				{/if}
				{#if data.isDisabled}
					<P
						class="text-semibold m-0 text-balance px-4 text-start text-sm leading-[1.4] text-muted-foreground *:p-0"
					>
						{i18n.t("errors.snapps.disabled")}
					</P>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
</div>
