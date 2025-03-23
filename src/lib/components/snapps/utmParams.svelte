<script lang="ts">
	import type { SvelteMap } from 'svelte/reactivity';

	import * as Table from '$lib/components/ui/table/index.js';
	import { getTranslations } from '$lib/i18n/index.svelte';

	import P from '../typography/text/p.svelte';
	import { Button } from '../ui/button';
	import { Input } from '../ui/input';

	const {
		params = $bindable(),
		showFooter = true,
		showHelper = true
	}: {
		params: SvelteMap<
			string,
			{
				key: string;
				name: string;
				value: string;
			}
		>;
		showFooter?: boolean;
		showHelper?: boolean;
	} = $props();
	const i18n = getTranslations();
</script>

<div class="mb-4 grid content-start gap-0">
	{#if showHelper}
		<P class="text-balance px-2 pb-2 text-sm text-muted-foreground"
			>{i18n.t('snapps.helpers.utm-params')}</P
		>
	{/if}

	<Table.Root>
		<Table.Header>
			<Table.Row>
				{#if showHelper}<Table.Head class="h-10 w-10 p-1"></Table.Head>{/if}
				<Table.Head class="h-10 p-1 px-2">{i18n.t('snapps.labels.utm.key')}</Table.Head>
				<Table.Head class="h-10 p-1 px-2">{i18n.t('snapps.labels.utm.value')}</Table.Head>
				<Table.Head class="h-10 p-1 px-2">{i18n.t('snapps.labels.utm.name')}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each params.entries() as [, param] (param.key)}
				<Table.Row>
					{#if showHelper}
						<Table.Cell class="p-1"
							><Button
								variant="ghost"
								class="h-8 w-8"
								onclick={() => {
									params.delete(param.key);
								}}><i class="ph ph-minus text-[20px]"></i></Button
							></Table.Cell
						>
					{/if}
					<Table.Cell class="p-1">
						<Input
							type="text"
							value={param.key}
							disabled={!showHelper}
							onchange={(e) => {
								params.delete(param.key);
								const value = e.currentTarget.value;
								params.set(value, { ...param, key: encodeURI(decodeURI(value)) });
							}}
						/>
					</Table.Cell>
					<Table.Cell class="p-1">
						<Input
							disabled={param.key === 'utm_' || !showHelper}
							type="text"
							value={param.value}
							onchange={(e) => {
								const value = e.currentTarget.value;
								params.set(param.key, { ...param, value: encodeURI(decodeURI(value)) });
							}}
						/>
					</Table.Cell>
					<Table.Cell class="p-1">
						<Input
							disabled={param.key === 'utm_' || !showHelper}
							type="text"
							value={param.name}
							onchange={(e) => {
								const value = e.currentTarget.value;
								params.set(param.key, { ...param, name: value });
							}}
						/>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
		{#if showFooter}
			<Table.Footer class="bg-muted/20">
				<Table.Row>
					{#if showHelper}
						<Table.Cell class="p-1"
							><Button
								variant="ghost"
								class="h-8 w-8"
								onclick={() => {
									params.set('utm_', {
										key: 'utm_',
										name: 'UTM ...',
										value: ''
									});
								}}><i class="ph ph-plus text-[20px]"></i></Button
							></Table.Cell
						>
					{/if}
					<Table.Cell class="p-1"></Table.Cell>
					<Table.Cell class="p-1"></Table.Cell>
					<Table.Cell class="p-1"></Table.Cell>
				</Table.Row>
			</Table.Footer>
		{/if}
	</Table.Root>
</div>
