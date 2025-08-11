<script lang="ts">
	import type { Infer, SuperValidated } from 'sveltekit-superforms';

	import P from '$lib/components/typography/text/p.svelte';
	import * as Tabs from '$lib/components/ui/tabs';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { decode } from 'html-entities';

	import type { BlackListSchema } from './blacklists/schema';
	import type { WhiteListSchema } from './whitelists/schema';

	import { BlackLists, WhiteLists } from '.';

	const {
		blackListForm,
		whiteListForm
	}: {
		blackListForm: SuperValidated<Infer<BlackListSchema>>;
		whiteListForm: SuperValidated<Infer<WhiteListSchema>>;
	} = $props();
	const i18n = getTranslations();

	let value = $state('whiteList');
</script>

<div class="grid h-max w-full grid-cols-1 gap-2 md:gap-4">
	<P class="text-sm leading-normal">{@html decode(i18n.t('admin.helpers.watchlists'))}</P>
	<Tabs.Root bind:value class="mt-4 w-full overflow-x-clip pe-1">
		<Tabs.List>
			<Tabs.Trigger value="whiteList">
				<div class="flex items-center gap-1">
					<i class="ph-duotone ph-shield text-[20px]"> </i>
					<span>{@html decode(i18n.t('admin.labels.whitelist'))}</span>
				</div>
			</Tabs.Trigger>
			<Tabs.Trigger value="blackList">
				<div class="flex items-center gap-1">
					<i class="ph-duotone ph-prohibit text-[20px]"> </i>
					<span>
						{@html decode(i18n.t('admin.labels.blacklist'))}
					</span>
				</div>
			</Tabs.Trigger>
		</Tabs.List>
		{#key value}
			<WhiteLists {whiteListForm}></WhiteLists>
			<BlackLists {blackListForm}></BlackLists>
		{/key}
	</Tabs.Root>
</div>
