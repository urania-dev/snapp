<script lang="ts">
	import type { Usage } from '@prisma/client';

	import { getLocalTimeZone } from '@internationalized/date';
	import { page } from '$app/state';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { getMetricsStore } from '$lib/stores/metrics.svelte';

	import { Separator } from '../ui/separator';
	import * as Table from '../ui/table';
	const mstore = getMetricsStore();

	let data = $state<{ id: null | string; name: null | string; shortcode: string; value: number }[]>(
		[]
	);
	const loadData = async () => {
		try {
			
		const res = (await (
			await (page.data.fetch as typeof fetch)(
				`/api/usage/groupBy?q=${JSON.stringify({
					_count: { snappId: true },
					by: ['snappId'],
					orderBy: { _count: { snappId: 'desc' } },
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
		).json()) as { data: ({ _count: { snappId: number } } & Usage)[] };
		if (res && res?.data) {
			const _data = await Promise.all(
				res.data.map(async (u) => {
					const snapp = (
						await (
							await (page.data.fetch as typeof fetch)(
								`/api/snapp/findFirst?q=${JSON.stringify({
									select: {
										groupId: true,
										id: true,
										shortcode: true,
										user: {
											select: { username: true }
										}
									},
									where: {
										id: u.snappId
									}
								})}`
							)
						).json()
					)?.data as { groupId: string; shortcode: string; user: { username: string } };
					if (snapp)
						return {
							id: u.snappId,
							name: snapp?.user?.username,
							shortcode: snapp.groupId
								? 'groups/' + snapp.groupId + '/' + snapp?.shortcode
								: snapp?.shortcode,
							value: u._count.snappId
						};
				})
			);
			data = _data.filter((d) => d !== undefined);
		}

	} catch (error) {
			console.log(error)
		}
	};

	const i18n = getTranslations();
</script>

<div class="flex h-full flex-col py-0">
	<Table.Root>
		<Table.Header>
			<Table.Row class="h-8">
				<Table.Head class="h-10 whitespace-nowrap px-2"
					>{i18n.t('snapps.fields.shortcode')}</Table.Head
				>
				<Table.Head class="h-10 px-2 ">{i18n.t('users.groups.labels.member')}</Table.Head>
				<Table.Head class="h-10 w-full min-w-max px-2">{i18n.t('snapps.fields.hit')}</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#await loadData()}
				<Table.Row>
					<Table.Cell colspan={3}>
						<div
							class="grid h-full min-h-[132px] w-full animate-spin place-content-center justify-center duration-1000"
						>
							<div class="flex h-10 w-10 items-center justify-center">
								<i class="ph ph-spinner text-[50px]"></i>
							</div>
						</div>
					</Table.Cell>
				</Table.Row>
			{:then}
				{#each data as { name, shortcode, value }}
					<Table.Row>
						<Table.Cell
							class="w-full max-w-[160px] overflow-clip text-ellipsis whitespace-nowrap font-medium"
							><a href="/{shortcode}" data-sveltekit-preload-data="off">/{shortcode}</a></Table.Cell
						>
						<Table.Cell class="w-full">{name}</Table.Cell>
						<Table.Cell class="w-full min-w-max">{value}</Table.Cell>
					</Table.Row>
				{/each}
			{/await}
		</Table.Body>
	</Table.Root>
	<Separator />
</div>
