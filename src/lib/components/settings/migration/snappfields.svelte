<script lang="ts">

	import P from '$lib/components/typography/text/p.svelte';
	import { getTranslations } from '$lib/i18n/index.svelte';

	import Selector from './selector.svelte';

	const {
		fields = $bindable(),
		snapp = $bindable()
	}: {
		fields: Set<string>;
		snapp: {
			createdAt: string | undefined;
			disabled: string | undefined;
			expiresAt: string | undefined;
			groupId: string | undefined;
			hit: string | undefined;
			maxUsages: string | undefined;
			notes: string | undefined;
			originalUrl: string | undefined;
			secret: string | undefined;
			shortcode: string | undefined;
			utmParams: string | undefined;
		};
	} = $props();
	const i18n = getTranslations();
</script>

{#if snapp}
	<div class="mt-4 flex w-full flex-col gap-4">
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.fields.original-url')}<span
					class="px-1 text-[18px] font-semibold text-destructive">*</span
				>
			</div>
			<Selector {fields} bind:value={snapp.originalUrl} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.fields.shortcode')}
				<span class="px-1 text-[18px] font-semibold text-destructive">*</span>
			</div>
			<Selector {fields} bind:value={snapp.shortcode} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.fields.created')}
			</div>
			<Selector {fields} bind:value={snapp.createdAt} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.fields.expiration')}
			</div>
			<Selector {fields} bind:value={snapp.expiresAt} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.fields.status')}
			</div>
			<Selector {fields} bind:value={snapp.disabled} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.fields.secret')}
			</div>
			<Selector {fields} bind:value={snapp.secret} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.fields.notes')}
			</div>
			<Selector {fields} bind:value={snapp.notes} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('users.groups.labels.single')}
			</div>
			<Selector {fields} bind:value={snapp.groupId} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.fields.hit')}
			</div>
			<Selector {fields} bind:value={snapp.hit} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.fields.max-usages')}
			</div>
			<Selector {fields} bind:value={snapp.maxUsages} />
		</div>
		<div class="flex w-full items-center gap-2">
			<div class="w-full text-sm text-muted-foreground">
				{i18n.t('snapps.labels.utm-params')}
			</div>
			<Selector {fields} bind:value={snapp.utmParams} />
		</div>
		<div class="flex w-full items-center gap-2">
			<P class="text-sm text-muted-foreground"
				><span class="px-1 text-[18px] font-semibold text-destructive">*</span>
				{i18n.t('migrations.helpers.required')}</P
			>
		</div>
	</div>
{/if}
