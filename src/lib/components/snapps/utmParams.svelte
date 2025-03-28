<script lang="ts">
	import type { Setting } from '@prisma/client';

	import { page } from '$app/state';
	import * as Popover from '$lib/components/ui/popover';
	import * as Table from '$lib/components/ui/table';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { toast } from 'svelte-sonner';
	import { SvelteMap } from 'svelte/reactivity';

	import P from '../typography/text/p.svelte';
	import { Button } from '../ui/button';
	import { Input } from '../ui/input';
	import PopoverContent from '../ui/popover/popover-content.svelte';

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
					savedParams.set(`${key}`, { key, name, value });
				}
			}
		} catch (error) {
			console.error(error);
			toast.error('errors.generic');
		}
	};

	let savedParams: SvelteMap<
		string,
		{
			key: string;
			name: string;
			value: string;
		}
	> = new SvelteMap();
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
				{#if showHelper}
					<Table.Head class="h-10 w-10 p-1"></Table.Head>
				{/if}
				<Table.Head class="h-10 p-1 px-2">{i18n.t('snapps.labels.utm.key')}</Table.Head>
				<Table.Head class="h-10 p-1 px-2">{i18n.t('snapps.labels.utm.value')}</Table.Head>
				<Table.Head class="h-10 p-1 px-2">{i18n.t('snapps.labels.utm.name')}</Table.Head>
				{#if showHelper}
					<Table.Head class="h-10 w-10 p-1">
						<Popover.Root>
							<Popover.Trigger>
								{#snippet child({ props })}
									<Button {...props} class=" relative h-8 w-8"
										><i class="ph-duotone ph-list-magnifying-glass text-[24px]"></i></Button
									>
								{/snippet}
							</Popover.Trigger>
							<PopoverContent class="p-2" align="end">
								{#await loadGlobalParams()}
									<div class="flex h-full min-h-[100px] w-full items-center justify-center">
										<div class="h-5 w-5 animate-spin duration-1000">
											<i class="ph ph-spinner text-[20px]"></i>
										</div>
									</div>
								{:then}
									<div class="flex flex-col gap-2 min-h-[100px]">
										{#each savedParams.entries() as [,param]}
										<Button class="h-8 p-1 flex items-center gap-2" variant=ghost onclick={()=>{
											if(params.has(param.key)) params.delete(param.key)
											else params.set(param.key,param)
										}}>
										<i class="ph ph-check transition-all text-[20px] opacity-0" class:opacity-100={params.has(param.key)}></i>
										<span class="w-full text-start">
											{param.name}
										</span>
									</Button>
										{/each}
										</div>
								{/await}
							</PopoverContent>
						</Popover.Root>
					</Table.Head>
				{/if}
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
					<Table.Cell class="p-1" colspan={2}>
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
					<Table.Cell class="p-1" colspan={2}></Table.Cell>
				</Table.Row>
			</Table.Footer>
		{/if}
	</Table.Root>
</div>
