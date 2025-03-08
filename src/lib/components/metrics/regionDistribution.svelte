<script lang="ts">
	import type { Usage } from '@prisma/client';

	import { getLocalTimeZone } from '@internationalized/date';
	import { page } from '$app/state';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { getMetricsStore } from '$lib/stores/metrics.svelte';

	import { Separator } from '../ui/separator';
	import * as Table from '../ui/table';
	const mstore = getMetricsStore();

	let data = $state<{ id: null | string; name: null | string; value: number }[]>([]);
	const loadData = async () => {
		const res = (await (
			await (page.data.fetch as typeof fetch)(
				`/api/usage/groupBy?q=${JSON.stringify({
					_count: { region: true },
					by: ['region'],
					orderBy: { _count: { region: 'desc' } },
					take: 10,
					where: {
						ownerId: page.data.user.role !== 'user' ? undefined : page.data.user.id,
						timestamp: {
							gte: mstore.start.toDate(getLocalTimeZone()).toISOString(),
							lte: mstore.end.toDate(getLocalTimeZone()).toISOString()
						}
					}
				})}`
			)
		).json()) as { data: ({ _count: { region: number } } & Usage)[] };
		if (res && res?.data) {
			data = res.data.map((d) => ({ id: d.region, name: d.region, value: d._count.region }));
		}
	};

	const i18n = getTranslations();
</script>

<div class="flex h-full flex-col py-0">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>{i18n.t('metrics.fields.region')}</Table.Head>
				<Table.Head>{i18n.t('snapps.fields.hit')}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#await loadData()}
				<Table.Row>
					<Table.Cell colspan={2}>
						<div
							class="grid h-full min-h-[132px] w-full animate-spin place-content-center justify-center duration-1000"
						>
							<div class="mx-auto flex h-10 w-10 items-center justify-center">
								<i class="ph ph-spinner text-[50px]"></i>
							</div>
						</div>
					</Table.Cell>
				</Table.Row>
			{:then}
				{#each data as { name, value }}
					<Table.Row>
						<Table.Cell>{name}</Table.Cell>
						<Table.Cell>{value}</Table.Cell>
					</Table.Row>
				{/each}
			{/await}
		</Table.Body>
	</Table.Root>
	<Separator />
</div>
