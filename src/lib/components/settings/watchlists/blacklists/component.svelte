<script lang="ts">
	import type { WatchList } from '@prisma/client';
	import type { Infer, SuperValidated } from 'sveltekit-superforms';

	import { page } from '$app/state';
	import * as Accordion from '$lib/components/ui/accordion';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import * as Tabs from '$lib/components/ui/tabs';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { Debouncer } from '$lib/stores/debounce.svelte';
	import { formatTimeAgo } from '$lib/utils';
	import { decode } from 'html-entities';
	import { toast } from 'svelte-sonner';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fade, fly } from 'svelte/transition';

	import type { BlackListSchema } from './schema';

	import Form from './form.svelte';

	const i18n = getTranslations();
	const debouncer = new Debouncer();
	type Fetch = typeof fetch;
	const apiBase = '/api/watchList';
	const f: Fetch = page.data.fetch;

	const { blackListForm }: { blackListForm: SuperValidated<Infer<BlackListSchema>> } = $props();
	const getblackListedUsernames = async () => {
		try {
			const { data, error } = (await (
				await f(`${apiBase}/findMany?q=${blackListQueryUsernames}`, { credentials: 'include' })
			).json()) as { data: WatchList[]; error: { message: string } };
			if (error) toast.error(error.message);
			return data;
		} catch (err) {
			console.error(err);
		}
		return [];
	};
	const getblackListedEmails = async () => {
		try {
			const { data, error } = (await (
				await f(`${apiBase}/findMany?q=${blackListQueryEmails}`, { credentials: 'include' })
			).json()) as { data: WatchList[]; error: { message: string } };
			if (error) toast.error(error.message);
			return data;
		} catch (err) {
			console.error(err);
		}
		return [];
	};
	const getblackListedDomains = async () => {
		try {
			const { data, error } = (await (
				await f(`${apiBase}/findMany?q=${blackListQueryDomains}`, { credentials: 'include' })
			).json()) as { data: WatchList[]; error: { message: string } };
			if (error) toast.error(error.message);
			return data;
		} catch (err) {
			console.error(err);
		}
		return [];
	};

	let lastUpdate = $state(new Date().toISOString());

	let skip = $state(0);
	let take = $state(5);
	let query = $state<string>('');

	let blackListQueryUsernames = $derived(
		JSON.stringify({
			skip,

			take,
			where:
				query.trim() !== ''
					? { allowed: false, AND: [{ domain: null }, { username: { contains: query } }] }
					: { allowed: false, domain: null }
		})
	);
	let blackListQueryEmails = $derived(
		JSON.stringify({
			skip,
			take,
			where:
				query.trim() !== ''
					? {
							allowed: false,
							AND: [
								{ domain: { not: null } },
								{ username: { not: null } },
								{ OR: [{ username: { contains: query } }, { domain: { contains: query } }] }
							]
						}
					: { allowed: false, domain: { not: null }, username: { not: null } }
		})
	);
	let blackListQueryDomains = $derived(
		JSON.stringify({
			skip,
			take,
			where:
				query.trim() !== ''
					? { allowed: false, AND: [{ username: null }, { domain: { contains: query } }] }
					: { allowed: false, username: null }
		})
	);
</script>

<div
	class="h-max w-full"
	in:fly={{
		duration: 400,

		opacity: prefersReducedMotion.current ? 1 : 0,
		x: prefersReducedMotion.current ? 0 : '100%'
	}}
>
	<Tabs.Content value="blackList" class="w-full">
		<Form bind:lastUpdate {blackListForm}></Form>
		<Accordion.Root type="single">
			<Accordion.Item value="username" class="border-b-0">
				<Accordion.Trigger
					class="group flex items-center justify-start border-b hover:no-underline"
				>
					<span class="me-auto ms-2 w-max items-center group-hover:underline">
						{decode(i18n.t('admin.labels.usernames'))}
					</span>
				</Accordion.Trigger>
				<Accordion.Content>
					<div class="grid w-full" in:fade|global>
						<div class="mt-4 flex items-center gap-2 rounded-sm border ps-2">
							<i class="ph ph-magnifying-glass text-[20px]"></i>
							<Input
								title={i18n.t('admin.placeholders.filter-watchlist')}
								placeholder={i18n.t('admin.placeholders.filter-watchlist')}
								oninput={(e) => {
									const value = e.currentTarget.value;
									debouncer.debounce(() => {
										query = value;
									}, 1000)();
								}}
								class=" cursor-text text-ellipsis p-2 text-start shadow-none"
								container="!border-none focus-within:!ring-0 focus-within:!ring-offset-0 focus-within:!ring-transparent focus-within:!border-transparent focus-within:!outline-transparent"
							/>
						</div>
						<Table.Root class="mb-0">
							<Table.Caption class="mt-0 border-t pb-4 pt-2 text-sm">
								<div class="flex w-full items-center justify-start gap-2">
									<span class="font-bold">
										{i18n.t('admin.labels.blacklist')}
									</span>
									<i class="ph ph-caret-right"></i>
									<span class="font-medium">
										{decode(i18n.t('admin.labels.usernames'))}
									</span>
								</div>
							</Table.Caption>
							<Table.Header>
								<Table.Row>
									<Table.Head colspan={3}>{i18n.t('admin.labels.usernames')}</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#key lastUpdate}
									{#await getblackListedUsernames()}
										<div
											class="flex h-16 w-full animate-spin items-center justify-center duration-1000"
										>
											<div class="grid h-6 w-6 place-content-center">
												<i class="ph ph-spinner text-[24px]"></i>
											</div>
										</div>
									{:then blackListedItems}
										{#each blackListedItems as item (item.id)}
											<Table.Row class="h-16 max-h-16">
												<Table.Cell
													class="overflow-clip text-ellipsis whitespace-nowrap font-medium"
													>{item.username}</Table.Cell
												>
												<Table.Cell class="whitespace-nowrap text-right"
													>{formatTimeAgo(item.createdAt, page.data.locale)}</Table.Cell
												>
												<Table.Cell class="p-2 text-right">
													<Button
														variant="ghost"
														size="icon"
														onclick={async () => {
															await (
																await f(
																	`${apiBase}/delete?q=${JSON.stringify({
																		where: {
																			id: item.id
																		}
																	})}`,
																	{
																		method: 'delete'
																	}
																)
															).json();
															lastUpdate = new Date().toISOString();
															const idx = blackListedItems.findIndex((i) => i.id === item.id);
															if (idx > -1) blackListedItems.splice(idx, 1);
														}}
													>
														<i class="ph ph-trash text-[20px]"></i>
														<span class="sr-only">Un-blackList this user</span>
													</Button>
												</Table.Cell>
											</Table.Row>
										{:else}
											<Table.Row class="h-16 max-h-16">
												<Table.Cell
													colspan={3}
													class="overflow-clip text-center text-ellipsis whitespace-nowrap font-medium"
												>
													<i class="ph ph-question text-[24px]"></i>
												</Table.Cell>
											</Table.Row>
										{/each}
									{/await}
								{/key}
							</Table.Body>
						</Table.Root>
					</div>
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="emails" class="border-b-0">
				<Accordion.Trigger
					class="group flex items-center justify-start border-b hover:no-underline"
				>
					<span class="me-auto ms-2 w-max items-center group-hover:underline">
						{decode(i18n.t('admin.labels.emails'))}
					</span>
				</Accordion.Trigger>
				<Accordion.Content>
					<div class="grid w-full" in:fade|global>
						<div class="mt-4 flex items-center gap-2 rounded-sm border ps-2">
							<i class="ph ph-magnifying-glass text-[20px]"></i>
							<Input
								title={i18n.t('admin.placeholders.filter-watchlist')}
								placeholder={i18n.t('admin.placeholders.filter-watchlist')}
								oninput={(e) => {
									const value = e.currentTarget.value;
									debouncer.debounce(() => {
										query = value;
									}, 1000)();
								}}
								class=" cursor-text text-ellipsis p-2 text-start shadow-none"
								container="!border-none focus-within:!ring-0 focus-within:!ring-offset-0 focus-within:!ring-transparent focus-within:!border-transparent focus-within:!outline-transparent"
							/>
						</div>
						<Table.Root class="mb-0">
							<Table.Caption class="mt-0 border-t pb-4 pt-2 text-sm">
								<div class="flex w-full items-center justify-start gap-2">
									<span class="font-bold">
										{i18n.t('admin.labels.blacklist')}
									</span>
									<i class="ph ph-caret-right"></i>
									<span class="font-medium">
										{decode(i18n.t('admin.labels.emails'))}
									</span>
								</div>
							</Table.Caption>
							<Table.Header>
								<Table.Row>
									<Table.Head colspan={3}>{i18n.t('admin.labels.emails')}</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#key lastUpdate}
									{#await getblackListedEmails()}
										<div
											class="flex h-16 w-full animate-spin items-center justify-center duration-1000"
										>
											<div class="grid h-6 w-6 place-content-center">
												<i class="ph ph-spinner text-[24px]"></i>
											</div>
										</div>
									{:then blackListedItems}
										{#each blackListedItems as item (item.id)}
											<Table.Row class="h-16 max-h-16">
												<Table.Cell
													class="overflow-clip text-ellipsis whitespace-nowrap font-medium"
													>{item.username}@{item.domain}</Table.Cell
												>
												<Table.Cell class="whitespace-nowrap text-right"
													>{formatTimeAgo(item.createdAt, page.data.locale)}</Table.Cell
												>
												<Table.Cell class="p-2 text-right">
													<Button
														variant="ghost"
														size="icon"
														onclick={async () => {
															await (
																await f(
																	`${apiBase}/delete?q=${JSON.stringify({
																		where: {
																			id: item.id
																		}
																	})}`,
																	{
																		method: 'delete'
																	}
																)
															).json();
															lastUpdate = new Date().toISOString();
															const idx = blackListedItems.findIndex((i) => i.id === item.id);
															if (idx > -1) blackListedItems.splice(idx, 1);
														}}
													>
														<i class="ph ph-trash text-[20px]"></i>
														<span class="sr-only">Un-blackList this user</span>
													</Button>
												</Table.Cell>
											</Table.Row>
										{:else}
											<Table.Row class="h-16 max-h-16">
												<Table.Cell
													colspan={3}
													class="overflow-clip text-center text-ellipsis whitespace-nowrap font-medium"
												>
													<i class="ph ph-question text-[24px]"></i>
												</Table.Cell>
											</Table.Row>
										{/each}
									{/await}
								{/key}
							</Table.Body>
						</Table.Root>
					</div>
				</Accordion.Content>
			</Accordion.Item>
			<Accordion.Item value="domains" class="border-b-0">
				<Accordion.Trigger
					class="group flex items-center justify-start border-b hover:no-underline"
				>
					<span class="me-auto ms-2 w-max items-center group-hover:underline">
						{decode(i18n.t('admin.labels.domains'))}
					</span>
				</Accordion.Trigger>
				<Accordion.Content>
					<div class="grid w-full" in:fade|global>
						<div class="mt-4 flex items-center gap-2 rounded-sm border ps-2">
							<i class="ph ph-magnifying-glass text-[20px]"></i>
							<Input
								title={i18n.t('admin.placeholders.filter-watchlist')}
								placeholder={i18n.t('admin.placeholders.filter-watchlist')}
								oninput={(e) => {
									const value = e.currentTarget.value;
									debouncer.debounce(() => {
										query = value;
									}, 1000)();
								}}
								class=" cursor-text text-ellipsis p-2 text-start shadow-none"
								container="!border-none focus-within:!ring-0 focus-within:!ring-offset-0 focus-within:!ring-transparent focus-within:!border-transparent focus-within:!outline-transparent"
							/>
						</div>
						<Table.Root class="mb-0">
							<Table.Caption class="mt-0 border-t pb-4 pt-2 text-sm">
								<div class="flex w-full items-center justify-start gap-2">
									<span class="font-bold">
										{i18n.t('admin.labels.blacklist')}
									</span>
									<i class="ph ph-caret-right"></i>
									<span class="font-medium">
										{decode(i18n.t('admin.labels.domains'))}
									</span>
								</div>
							</Table.Caption>
							<Table.Header>
								<Table.Row>
									<Table.Head colspan={3}>{i18n.t('admin.labels.domains')}</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#key lastUpdate}
									{#await getblackListedDomains()}
										<div
											class="flex h-16 w-full animate-spin items-center justify-center duration-1000"
										>
											<div class="grid h-6 w-6 place-content-center">
												<i class="ph ph-spinner text-[24px]"></i>
											</div>
										</div>
									{:then blackListedItems}
										{#each blackListedItems as item (item.id)}
											<Table.Row class="h-16 max-h-16">
												<Table.Cell
													class="overflow-clip text-ellipsis whitespace-nowrap font-medium"
													>{item.domain}</Table.Cell
												>
												<Table.Cell class="whitespace-nowrap text-right"
													>{formatTimeAgo(item.createdAt, page.data.locale)}</Table.Cell
												>
												<Table.Cell class="p-2 text-right">
													<Button
														variant="ghost"
														size="icon"
														onclick={async () => {
															await (
																await f(
																	`${apiBase}/delete?q=${JSON.stringify({
																		where: {
																			id: item.id
																		}
																	})}`,
																	{
																		method: 'delete'
																	}
																)
															).json();
															lastUpdate = new Date().toISOString();
															const idx = blackListedItems.findIndex((i) => i.id === item.id);
															if (idx > -1) blackListedItems.splice(idx, 1);
														}}
													>
														<i class="ph ph-trash text-[20px]"></i>
														<span class="sr-only">Un-blackList this user</span>
													</Button>
												</Table.Cell>
											</Table.Row>
										{:else}
											<Table.Row class="h-16 max-h-16">
												<Table.Cell
													colspan={3}
													class="overflow-clip text-center text-ellipsis whitespace-nowrap font-medium"
												>
													<i class="ph ph-question text-[24px]"></i>
												</Table.Cell>
											</Table.Row>
										{/each}
									{/await}
								{/key}
							</Table.Body>
						</Table.Root>
					</div>
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</Tabs.Content>
</div>
