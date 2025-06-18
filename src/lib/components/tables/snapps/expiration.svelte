<script lang="ts">
	import { page } from '$app/state';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { cn, formatTimeAgo } from '$lib/utils';

	const { expiresAt }: { expiresAt: Date | null } = $props();

	const i18n = getTranslations();
</script>

<div class="flex h-full w-full items-center justify-center">
	{#if expiresAt === null}
		<small class="text-xs font-semibold tracking-wide opacity-30"
			>{i18n.t('globals.disabled')}</small
		>
	{:else}
		<Tooltip.Provider>
			<Tooltip.Root>
				<Tooltip.Trigger
					class={cn(buttonVariants({ variant: 'ghost' }), 'h-8 w-8 p-0')}
					disabled={expiresAt === null}
				>
					<i class="ph-duotone ph-clock text-[20px] ${expiresAt ? 'opacity-100' : 'opacity-25'}"
					></i>
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>{formatTimeAgo(expiresAt, page.data.locale || 'en')}</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{/if}
</div>
