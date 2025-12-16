<script lang="ts">
	import type { MouseEventHandler } from 'svelte/elements';

	import CornerDownRightIcon from '@lucide/svelte/icons/corner-down-right';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import * as Accordion from '$lib/components/ui/accordion/index';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Table from '$lib/components/ui/table/index';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import {
		deleteFromWatchlist,
		getDomainBlacklist,
		getEmailBlacklist,
		getUsernameBlacklist
	} from '$lib/remotes/watchlists.remote';
	import { toast } from 'svelte-sonner';
	const { limit = $bindable(10), page = $bindable(0) }: { limit: number; page: number } = $props();
	const deleteIdFromWatchlists: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement> = async (
		e
	) => {
		const idx = e.currentTarget.dataset.idx;
		if (!idx) return;
		try {
			await deleteFromWatchlist([idx]).updates(
				getDomainBlacklist({ limit, page }),
				getEmailBlacklist({ limit, page }),
				getUsernameBlacklist({ limit, page })
			);
			toast.success(m.settings_saved());
		} catch (error) {
			console.error('[watchlists] Blacklist FE', error);
			toast.success(m.errors_settings_saving());
		}
	};
</script>

<Accordion.Root type="single" class="w-full">
	<Accordion.Item value="username" class="p-0!">
		<Accordion.Trigger class="group h-10 items-center px-4 no-underline!"
			><CornerDownRightIcon class=" size-4! rotate-0!" />
			<span class="me-auto">{m.username()}</span></Accordion.Trigger
		>
		<Accordion.Content class="border-b-2 py-0!">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="px-4">{m.term()}</Table.Head>
						<Table.Head class="px-4">{m.created_at()}</Table.Head>
						<Table.Head class="px-4"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each await getUsernameBlacklist({ limit, page }) as blacklist (blacklist.id)}
						<Table.Row class="group h-10 odd:bg-muted/20">
							<Table.Head class="px-4 @xl:text-xs font-medium">{blacklist.username}</Table.Head>
							<Table.Cell class="px-4 @xl:text-xs"
								>{new Date(blacklist.createdAt).toLocaleDateString(getLocale(), {
									dateStyle: 'short'
								})}</Table.Cell
							>
							<Table.Cell class="px-4">
								<ButtonGroup class="ms-auto opacity-0 transition-all group-hover:opacity-100">
									<Button
										size="icon-sm"
										variant="outline"
										data-idx={blacklist.id}
										onclick={deleteIdFromWatchlists}><TrashIcon /></Button
									>
								</ButtonGroup>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell class="h-50" colspan={3}>
								<div class="w-full h-full grid place-content-center">
									{m.no_results()}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="domain" class="p-0">
		<Accordion.Trigger class="group h-10 items-center px-4 no-underline!"
			><CornerDownRightIcon class=" size-4! rotate-0!" />
			<span class="me-auto">{m.domain()}</span></Accordion.Trigger
		>
		<Accordion.Content class="border-b-2 py-0!">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="px-4">{m.term()}</Table.Head>
						<Table.Head class="px-4">{m.created_at()}</Table.Head>
						<Table.Head class="px-4"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each await getDomainBlacklist({ limit, page }) as blacklist (blacklist.id)}
						<Table.Row class="group h-10 odd:bg-muted/20">
							<Table.Head class="px-4 @xl:text-xs font-medium">{blacklist.domain}</Table.Head>
							<Table.Cell class="px-4 @xl:text-xs"
								>{new Date(blacklist.createdAt).toLocaleDateString(getLocale(), {
									dateStyle: 'short'
								})}</Table.Cell
							>
							<Table.Cell class="px-4">
								<ButtonGroup class="ms-auto opacity-0 transition-all group-hover:opacity-100">
									<Button
										size="icon-sm"
										variant="outline"
										data-idx={blacklist.id}
										onclick={deleteIdFromWatchlists}><TrashIcon /></Button
									>
								</ButtonGroup>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell class="h-50" colspan={3}>
								<div class="w-full h-full grid place-content-center">
									{m.no_results()}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Accordion.Content>
	</Accordion.Item>
	<Accordion.Item value="email" class="p-0">
		<Accordion.Trigger class="group h-10 items-center px-4 no-underline!"
			><CornerDownRightIcon class=" size-4! rotate-0!" />
			<span class="me-auto">{m.email()}</span></Accordion.Trigger
		>
		<Accordion.Content class="border-b-2 py-0">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="px-4">{m.term()}</Table.Head>
						<Table.Head class="px-4">{m.created_at()}</Table.Head>
						<Table.Head class="px-4"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each await getEmailBlacklist({ limit, page }) as blacklist (blacklist.id)}
						<Table.Row class="group h-10 odd:bg-muted/20">
							<Table.Head class="px-4 @xl:text-xs font-medium"
								>{`${blacklist.username}@${blacklist.domain}`}</Table.Head
							>
							<Table.Cell class="px-4 @xl:text-xs"
								>{new Date(blacklist.createdAt).toLocaleDateString(getLocale(), {
									dateStyle: 'short'
								})}</Table.Cell
							>
							<Table.Cell class="px-4">
								<ButtonGroup class="ms-auto opacity-0 transition-all group-hover:opacity-100">
									<Button
										size="icon-sm"
										variant="outline"
										data-idx={blacklist.id}
										onclick={deleteIdFromWatchlists}><TrashIcon /></Button
									>
								</ButtonGroup>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell class="h-50" colspan={3}>
								<div class="w-full h-full grid place-content-center">
									{m.no_results()}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Accordion.Content>
	</Accordion.Item>
</Accordion.Root>
