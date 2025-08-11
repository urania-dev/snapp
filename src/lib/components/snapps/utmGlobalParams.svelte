<script lang="ts">
	import type { Setting } from '@prisma/client';

	import { page } from '$app/state';
	import * as Table from '$lib/components/ui/table/index.js';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { prefersReducedMotion } from 'svelte/motion';
	import { SvelteMap } from 'svelte/reactivity';
	import { fly } from 'svelte/transition';

	import H4 from '../typography/heading/h4.svelte';
	import P from '../typography/text/p.svelte';
	import { Button } from '../ui/button';
	import { Input } from '../ui/input';

	const {
		showFooter = true
	}: {
		showFooter?: boolean;
	} = $props();
	const i18n = getTranslations();

	const params: SvelteMap<
		string,
		{
			key: string;
			name: string;
			value: string;
		}
	> = new SvelteMap([]);

	const loadGlobalParams = async () => {
		const f = page.data.fetch as typeof fetch;
		try {
			const response =
				((await (
					await f(
						`/api/setting/findFirst?q=${JSON.stringify({
							where: {
								field: `GLOBAL_UTM_PARAMS_${page.data.user.id}`,
								id: `GLOBAL_UTM_PARAMS_${page.data.user.id}`
							}
						})}`
					)
				).json()) as { data: null | Setting }) || null;

			if ('data' in response && response.data !== null && response.data.value !== '{}') {
				const stringifiedParams =
					(response.data.value && response.data.value.trim() !== '' && response.data.value) || '[]';
				const storedParams = JSON.parse(stringifiedParams || '[]') as string[][];

				for (const [key, value, name] of storedParams) {
					params.set(`${key}`, { key, name, value });
				}
			}
			if (params.size === 0) {
				params.set('utm_', { key: 'utm_', name: 'NEW_UTM', value: '' });
			}
		} catch (error) {
			console.error(error);
			toast.error('errors.generic');
		}
		loading = false;
		saving = false;
	};

	$effect(() => {
		untrack(() => {
			loadGlobalParams();
		});
	});

	const updateParams = async () => {
		saving = true;
		const f = page.data.fetch as typeof fetch;
		try {
			const data = [];
			for (const [, { key, name, value: v }] of params.entries()) {
				data.push([key, v, name]);
			}
			const value = JSON.stringify(data);
			const res = (await (
				await f(`/api/setting/upsert`, {
					body: JSON.stringify({
						create: {
							field: `GLOBAL_UTM_PARAMS_${page.data.user.id}`,
							id: `GLOBAL_UTM_PARAMS_${page.data.user.id}`,
							value
						},
						update: {
							value
						},
						where: {
							field: `GLOBAL_UTM_PARAMS_${page.data.user.id}`,
							id: `GLOBAL_UTM_PARAMS_${page.data.user.id}`
						}
					}),
					credentials: 'include',
					method: 'post'
				})
			).json()) as { data: null | Setting };
			if (res.data !== null) toast.info(i18n.t('globals.saved'));
		} catch (error) {
			console.error(error);
			toast.error('errors.generic');
		}
		loading = false;
		saving = false;
	};

	let loading = $state(true);
	let saving = $state(true);
</script>

<div class="mb-4 grid content-start gap-0">
	<div class="mt-2 flex w-full items-center justify-between">
		<H4 class="hidden md:block">{i18n.t('snapps.labels.utm-params')}</H4>
		<Button disabled={saving} class="w-full md:max-w-max" onclick={updateParams}>
			<div class="flex items-center gap-2">
				<span>
					{i18n.t('globals.save')}
				</span>
				{#if saving}
					<div class="flex h-5 w-5 animate-spin items-center">
						<i class="ph-duotone ph-spinner text-[20px]"></i>
					</div>
				{:else}
					<i class="ph-duotone ph-floppy-disk text-[20px]"></i>
				{/if}
			</div>
		</Button>
	</div>

	<P class="mb-4 text-balance px-2 pb-2 text-sm text-muted-foreground"
		>{i18n.t('snapps.helpers.utm-global-params')}</P
	>
	{#if loading}
		<div class="flex h-full min-h-[100px] w-full items-center justify-center">
			<div class="h-5 w-5 animate-spin duration-1000">
				<i class="ph ph-spinner text-[20px]"></i>
			</div>
		</div>
	{:else}
		<div in:fly={{ opacity: prefersReducedMotion.current ? 1 : 0, x: 0, y: 0 }}>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="h-10 w-8 p-1"></Table.Head>
						<Table.Head class="h-10">
							<span class="p-1 px-2 text-sm">{i18n.t('snapps.labels.utm.name')}</span>
						</Table.Head>
						<Table.Head class="h-10">
							<span class="p-1 px-2 text-sm">{i18n.t('snapps.labels.utm.key')}</span>
						</Table.Head>
						<Table.Head class="h-10">
							<span class="p-1 px-2 text-sm">{i18n.t('snapps.labels.utm.value')}</span>
						</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each params.entries() as [paramKey, param] ([param.name, param.key].join('_'))}
						<Table.Row>
							<Table.Cell class="p-1"
								><Button
									variant="ghost"
									class="h-8 w-8"
									onclick={() => {
										params.delete(paramKey);
									}}><i class="ph ph-minus text-[20px]"></i></Button
								></Table.Cell
							>
							<Table.Cell class="p-1">
								<Input
									disabled={saving}
									type="text"
									value={param.name}
									onchange={(e) => {
										const p = param;
										params.delete(paramKey);
										const value = e.currentTarget.value;
										params.set(value, { ...p, name: value });
									}}
								/>
							</Table.Cell>
							<Table.Cell class="p-1">
								<Input disabled={saving} type="text" bind:value={param.key} />
							</Table.Cell>
							<Table.Cell class="p-1">
								<Input disabled={saving} type="text" bind:value={param.value} />
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
				{#if showFooter}
					<Table.Footer class="bg-muted/20">
						<Table.Row>
							<Table.Cell class="p-1"
								><Button
									variant="ghost"
									class="h-8 w-8"
									onclick={() => {
										params.set(`NEW_UTM_${params.size}`, {
											key: 'utm_',
											name: `NEW_UTM_${params.size}`,
											value: ''
										});
									}}><i class="ph ph-plus text-[20px]"></i></Button
								></Table.Cell
							>
							<Table.Cell class="p-1"></Table.Cell>
							<Table.Cell class="p-1"></Table.Cell>
							<Table.Cell class="p-1" colspan={2}></Table.Cell>
						</Table.Row>
					</Table.Footer>
				{/if}
			</Table.Root>
		</div>
	{/if}
</div>
