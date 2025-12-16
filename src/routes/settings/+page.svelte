<script>
	import CogIcon from '@lucide/svelte/icons/cog';
	import { env } from '$env/dynamic/public';
	import AppStats from '$lib/components/blocks/settings/app-stats.svelte';
	import EnableHomepage from '$lib/components/blocks/settings/enable-homepage.svelte';
	import EnableLowercaseFallback from '$lib/components/blocks/settings/enable-lowercase-fallback.svelte';
	import EnableMultiAuth from '$lib/components/blocks/settings/enable-multi-auth.svelte';
	import EnableRegistration from '$lib/components/blocks/settings/enable-registration.svelte';
	import Integrations from '$lib/components/blocks/settings/integrations.svelte';
	import Limits from '$lib/components/blocks/settings/limits.svelte';
	import Smtp from '$lib/components/blocks/settings/smtp.svelte';
	import Watchlists from '$lib/components/blocks/settings/watchlists.svelte';
	import { m } from '$lib/paraglide/messages';
	const { data } = $props();
</script>

<div class="@container flex h-full w-full flex-col">
	<div class="flex h-14 w-full items-center gap-4 border-b p-4">
		<CogIcon class="size-8! fill-secondary/50" />
		<h1 class="text-2xl font-bold">{m.settings()}</h1>
	</div>
	<div class="flex shrink-0 flex-col overflow-x-hidden overflow-y-auto @2xl:h-max @2xl:flex-row">
		<div class="flex shrink-0 flex-col gap-[14.5px] px-4 pt-4 @2xl:w-1/2 @2xl:p-4 @2xl:pe-2">
			<EnableRegistration host={data.host} />
			<EnableHomepage host={data.host} />
			<EnableMultiAuth host={data.host} />
			<Limits host={data.host} />
			<!-- @TODO: REMOVE BEFORE LAUNCH -->
			{#if env.PUBLIC_BETA?.toString()?.toLowerCase() !== 'true' && data.smtp}
				<Smtp smtp={data.smtp} />
			{/if}
			<Integrations host={data.host} />
			<EnableLowercaseFallback host={data.host} />
		</div>
		<div class="flex shrink-0 flex-col gap-4 px-4 pt-4 pb-4 @2xl:w-1/2 @2xl:p-4 @2xl:ps-2">
			<Watchlists />
			<AppStats info={data.serverInfo} />
		</div>
	</div>
</div>
