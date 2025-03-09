<script lang="ts">
	import type { User } from '@prisma/client';

	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import Separator from '$lib/components/ui/separator/separator.svelte';
	import * as Table from '$lib/components/ui/table';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { Debouncer } from '$lib/stores/debounce.svelte';
	import { toast } from 'svelte-sonner';

	let {
		groupId,
		memberCount,
		members: initialMembers,
		open = $bindable()
	}: {
		groupId: string;
		memberCount: number;
		members: Omit<User, 'password' | 'tfs'>[];

		open: boolean;
	} = $props();
	const i18n = getTranslations();

	let query = $state<string>();
	let queryMember = $state<string>();
	let userCount = $state<number>();

	const loadUsers = async (query: string | undefined) => {
		const f = page.data.fetch as typeof fetch;
		try {
			const res = await (
				await f(
					`/api/user/findMany?q=${JSON.stringify({
						take: 5,
						where: {
							AND: [
								(query && {
									OR: [{ username: { contains: query } }, { email: { contains: query } }]
								}) ||
									{},
								{
									groups: {
										none: { slug: groupId }
									}
								}
							]
						}
					})}`
				)
			).json();
			userCount = (
				await (
					await f(
						`/api/user/count?q=${JSON.stringify({
							where: {
								groups: {
									none: { slug: groupId }
								}
							}
						})}`
					)
				).json()
			).data as number;
			users = res.data as Omit<User, 'password' | 'tfs'>[];
		} catch (error) {
			toast.error('errors.generic');
			console.error(error);
		}
	};

	let users = $state<Omit<User, 'password' | 'tfs'>[]>([]);
	let members = $state<Omit<User, 'password' | 'tfs'>[]>(initialMembers || []);

	const debouncer = new Debouncer();
	const saved = debouncer.debounce(() => {
		toast.info(i18n.t('globals.saved'));
	}, 1000);
</script>

<Dialog.Root
	bind:open
	onOpenChange={async (isOpen) => {
		if (!isOpen) await invalidateAll();
	}}
>
	<Dialog.Content
		class="max-h-[calc(100vh_-_5rem)] max-w-[calc(100%_-_2rem)] overflow-clip overflow-y-scroll rounded lg:max-w-3xl"
	>
		<Dialog.Header>
			<Dialog.Title>{i18n.t('users.groups.labels.manage')}</Dialog.Title>
			<Dialog.Description class="text-balance pt-4"></Dialog.Description>
		</Dialog.Header>
		<div class="flex flex-col gap-8 lg:flex-row">
			<Table.Root class="overflow-clip rounded">
				<Table.Header class="bg-muted">
					<Table.Row>
						<Table.Head>{i18n.t('menu.users')} {userCount ? `[ ${userCount} ]` : ''}</Table.Head>
					</Table.Row>
				</Table.Header>
				{#await loadUsers(query)}
					<Table.Body class="min-h-[250px] w-full overflow-clip overflow-y-scroll">
						<Table.Row class="w-full">
							<Table.Cell class="w-full">
								<div class="flex h-full min-h-[200px] w-full items-center justify-center">
									<div class="m-auto h-5 w-5 animate-spin duration-1000">
										<i class="ph ph-spinner text-[20px]"></i>
									</div>
								</div>
							</Table.Cell>
						</Table.Row>
					</Table.Body>
				{:then}
					<Table.Body
						class="grid min-h-[250px] w-full content-start overflow-clip overflow-y-scroll"
					>
						{#each users as user, idx}
							<Table.Row
								class="max-h-[52px] w-full"
								onclick={async () => {
									const [u] = users.splice(idx, 1);
									if (u) members.push(u);
									try {
										const f = page.data.fetch as typeof fetch;
										await (
											await f('/api/group/update', {
												body: JSON.stringify({
													data: {
														users: { connect: { id: u.id } }
													},
													where: { slug: groupId }
												}),
												credentials: 'include',
												method: 'PATCH'
											})
										).json();

										userCount = Math.max(0, userCount || 0 - 1);
										memberCount++;
										saved();
									} catch (error) {
										console.error(error);
									}
								}}
							>
								<Table.Cell class="max-h-[52px] w-full text-sm">
									{user.username}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				{/await}
				<Table.Footer>
					<Table.Row>
						<Table.Cell class="flex h-10 items-center gap-2 rounded-sm border ps-2">
							<Input
								icon="magnifying-glass"
								title={i18n.t('users.placeholders.search')}
								placeholder={i18n.t('users.placeholders.search')}
								bind:value={query}
								class=" cursor-text text-ellipsis p-2 text-start shadow-none"
								container="!border-none focus-within:!ring-0 focus-within:!ring-offset-0 focus-within:!ring-transparent focus-within:!border-transparent focus-within:!outline-transparent"
							/>
						</Table.Cell>
					</Table.Row>
				</Table.Footer>
			</Table.Root>
			<Separator orientation="vertical" class="hidden lg:block" />
			<Table.Root class="overflow-clip rounded">
				<Table.Header class="bg-muted">
					<Table.Row>
						<Table.Head>{i18n.t('users.groups.labels.members')} [ {memberCount} ]</Table.Head>
					</Table.Row>
				</Table.Header>

				<Table.Body class="grid min-h-[250px] w-full content-start overflow-clip overflow-y-scroll">
					{#each members.filter((m) => {
						if (typeof queryMember === 'string' && queryMember.trim() !== '') return m.username.includes(queryMember!);
						if (typeof queryMember === 'string' && queryMember.trim() !== '') return m.email.includes(queryMember!);
						return true;
					}) as user, idx}
						<Table.Row
							onclick={async () => {
								const [u] = members.splice(idx, 1);
								if (u) users.push(u);
								const f = page.data.fetch as typeof fetch;
								try {
									await (
										await f('/api/group/update', {
											body: JSON.stringify({
												data: {
													users: { disconnect: { id: u.id } }
												},
												where: { slug: groupId }
											}),
											credentials: 'include',
											method: 'PATCH'
										})
									).json();
									memberCount--;
									userCount = Math.max(0, userCount || 0 + 1);
								} catch (error) {
									console.error(error);
								}
								saved();
							}}
						>
							<Table.Cell class="h-[52px]">
								{user.username}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>

				<Table.Footer>
					<Table.Row>
						<Table.Cell class="flex h-10 items-center gap-2 rounded-sm border ps-2">
							<Input
								icon="magnifying-glass"
								title={i18n.t('users.placeholders.search')}
								placeholder={i18n.t('users.placeholders.search')}
								bind:value={queryMember}
								class=" cursor-text text-ellipsis p-2 text-start shadow-none"
								container="!border-none focus-within:!ring-0 focus-within:!ring-offset-0 focus-within:!ring-transparent focus-within:!border-transparent focus-within:!outline-transparent"
							/>
						</Table.Cell>
					</Table.Row>
				</Table.Footer>
			</Table.Root>
		</div>
	</Dialog.Content>
</Dialog.Root>
