<script lang="ts">
	import type { Snapp, Tag } from '@prisma/client';

	import { ManageGroup } from '$lib/components/groups';
	import { columns } from '$lib/components/tables/snapps/columns.svelte';
	import DataTable from '$lib/components/tables/snapps/table.svelte';
	import H2 from '$lib/components/typography/heading/h2.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { getTranslations } from '$lib/i18n/index.svelte';
	const { data } = $props();
	const i18n = getTranslations();

	interface SnappWithTags extends Snapp {
		tag: Tag[];
	}

	let manageGroup = $state(false);
</script>

<div class="flex w-full flex-col">
	<div class="flex w-full items-center justify-between px-4">
		<div class="flex h-20 w-full items-center gap-2">
			<i class="ph-duotone ph-chats text-[32px]"></i>
			<H2 class="m-0 p-0">{data.group.name}</H2>
		</div>
		{#if data.user.role !== 'user'}
			<Button
				onclick={() => {
					manageGroup = !manageGroup;
				}}
			>
				<i class="ph-duotone ph-user-plus text-[22px]"></i>
				<span class="hidden md:block">
					{i18n.t('users.groups.labels.manage')}
				</span>
			</Button>
		{/if}
	</div>
	<Separator />
</div>
<div class="flex w-full flex-col pt-4">
	<DataTable
		isPrivate={data.user.role !== 'user' || false}
		limit={data.limit}
		columns={columns(i18n, false)}
		data={data.snapps as SnappWithTags[]}
		rowCount={data.rowCount}
		pageCount={data.pageCount}
		page={Math.floor(parseInt(data.page))}
	></DataTable>
</div>

<ManageGroup
	groupId={data.groupId}
	bind:open={manageGroup}
	members={data.group?.users || []}
	memberCount={data.group._count.users}
/>
