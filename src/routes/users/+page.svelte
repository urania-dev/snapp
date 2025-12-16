<script lang="ts">
	import UsersRoundIcon from '@lucide/svelte/icons/users-round';
	import InviteUser from '$lib/components/blocks/users/invite-user.svelte';
	import TableUser from '$lib/components/blocks/users/table-users.svelte';
	import { columns } from '$lib/components/blocks/users/users.columns.svelte.js';
	import { m } from '$lib/paraglide/messages';

	const { data } = $props();

	let selected = $state<null | string>(null);
	let showCreate = $state(false);
	let showDelete = $state(false);
</script>

<div class="@container flex w-full grow flex-col">
	<div class="flex h-14 w-full items-center gap-4 border-b p-4">
		<UsersRoundIcon class="size-8! fill-secondary/50" />
		<h1 class="text-2xl font-bold">{m.users()}</h1>
	</div>
	<div class="flex h-full w-full flex-col divide-y @5xl:flex-row @5xl:divide-x @5xl:divide-y-0">
		<div class="flex h-full w-full flex-col divide-y">
			<TableUser
				limit={data.limit}
				columnVisibility={data.columnVisibility}
				data={(data?.users || []) as User[]}
				{columns}
				bind:showCreate
				bind:showDelete
				bind:selected
			/>
		</div>
	</div>
</div>
<InviteUser bind:open={showCreate} />
