<script lang="ts">
	import type { SvelteURL } from 'svelte/reactivity';

	import * as Select from '$lib/components/ui/select/index.js';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { fly } from 'svelte/transition';

	import { Button } from '../ui/button';
	import Separator from '../ui/separator/separator.svelte';
	let {
		active,
		enabledLimits = false,
		isAdmin = false,
		url = $bindable()
	}: {
		active: string;
		enabledLimits?: boolean;
		isAdmin?: boolean;
		url: SvelteURL;
	} = $props();

	const i18n = getTranslations();
	const mobile = new IsMobile();

	const items = $derived([
		{
			id: '#profile',
			label: i18n.t('users.labels.profile'),
			visible: true
		},
		{
			id: '#tokens',
			label: i18n.t('tokens.label'),
			visible: true
		},
		{
			id: '#admin',
			label: i18n.t('admin.label'),
			visible: isAdmin
		},
		{
			id: '#smtp',
			label: i18n.t('admin.labels.smtp'),
			visible: isAdmin
		},
		{
			id: '#watchlists',
			label: i18n.t('admin.labels.watchlists'),
			visible: isAdmin
		},
		{
			id: '#limits',
			label: i18n.t('admin.labels.limits'),
			visible: enabledLimits && isAdmin
		},
		{
			id: '#utmParams',
			label: i18n.t('snapps.labels.utm-params'),
			visible:true
		},
		{
			id: '#migration',
			label: i18n.t('migrations.label'),
			visible: true
		}
	]);
</script>

<div class="flex max-h-max w-full flex-col md:max-w-[15rem] lg:max-w-xs">
	{#if mobile.current}
		<div class="flex w-full flex-col gap-2 p-2">
			<Select.Root
				type="single"
				bind:value={active}
				onValueChange={(v) => {
					url.hash = `${v}`;
					window.location.hash = `${v}`;
				}}
			>
				<div class="flex w-full items-center p-4">
					<Select.Trigger class="w-full font-semibold">
						{#if active === '#profile'}
							{i18n.t('users.labels.profile')}
						{/if}
						{#if active === '#tokens'}
							{i18n.t('tokens.label')}
						{/if}
						{#if active === '#admin'}
							{i18n.t('admin.label')}
						{/if}
						{#if active === '#smtp'}
							{i18n.t('admin.labels.smtp')}
						{/if}
						{#if active === '#watchlists'}
							{i18n.t('admin.labels.watchlists')}
						{/if}
						{#if active === '#limits'}
							{i18n.t('admin.labels.limits')}
						{/if}
						{#if active === '#migration'}
							{i18n.t('migrations.label')}
						{/if}
						{#if active === '#utmParams'}
							{i18n.t('snapps.labels.utm-params')}
						{/if}
					</Select.Trigger>
					<Select.Content>
						{#each items as item (item.id)}
							{#if item.visible === true}
								<Select.Item value={item.id}>{i18n.t(item.label)}</Select.Item>
							{/if}
						{/each}
					</Select.Content>
				</div>
			</Select.Root>
		</div>
		<Separator />
	{:else}
		<div class="flex w-full flex-col gap-2 p-2">
			{#each items as item, idx}
				{#if item.visible === true}
					<div
						class="h-max w-full"
						in:fly|global={{ delay: (idx + 1) * 125, duration: 400, y: 12 }}
					>
						<Button
							onclick={() => {
								url.hash = `${item.id}`;
								window.location.hash = `${item.id}`;
							}}
							variant={active === item.id ? 'default' : 'ghost'}
							class="w-full cursor-pointer justify-start"
						>
							{i18n.t(item.label)}
						</Button>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>
