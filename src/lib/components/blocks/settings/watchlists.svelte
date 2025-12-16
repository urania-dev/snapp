<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Item from '$lib/components/ui/item';
	import { m } from '$lib/paraglide/messages';

	import ConfigBlacklist from './blacklist.svelte';
	import ConfigWatchlistToolbar from './watchlist-toolbar.svelte';
	import ConfigWhitelist from './whitelist.svelte';
	let limit = $state(10);
	let page = $state(1);
	let accordionOpen = $state<string | undefined>();
</script>

<Item.Root class="min-h-24 w-full border-0 p-0 @3xl:order-1" size="sm">
	<Item.Root variant="outline" size="sm" class="min-h-24 w-full p-0">
		<Item.Content class="h-full">
			<Accordion.Root type="single" bind:value={accordionOpen} class="w-full">
				<Accordion.Item value="watchlist" class="p-0">
					<Accordion.Trigger class="group min-h-24 px-4 no-underline!">
						<div class="flex flex-col gap-1">
							<span>{m.control_watchlists()}</span>
							<span class="max-w-md @xl:text-xs text-balance text-muted-foreground"
								>{m.control_watchlists_helper()}</span
							>
						</div>
					</Accordion.Trigger>
					<Accordion.Content class="w-full p-0">
						<ConfigWatchlistToolbar bind:limit bind:page />
						<Accordion.Root type="single">
							<Accordion.Item value="whitelist">
								<Accordion.Trigger class="group px-4 no-underline! data-[state=open]:border-b"
									>{m.control_watchlists_whitelist()}</Accordion.Trigger
								>
								<Accordion.Content class="py-0">
									<div>
										{#if accordionOpen}
											<ConfigWhitelist bind:limit bind:page />
										{/if}
									</div>
								</Accordion.Content>
							</Accordion.Item>
							<Accordion.Item value="blacklist">
								<Accordion.Trigger class="group px-4 no-underline! data-[state=open]:border-b"
									>{m.control_watchlists_blacklist()}</Accordion.Trigger
								>
								<Accordion.Content class="py-0">
									<div>
										{#if accordionOpen}
											<ConfigBlacklist bind:limit bind:page />
										{/if}
									</div>
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</Item.Content>
	</Item.Root>
</Item.Root>
