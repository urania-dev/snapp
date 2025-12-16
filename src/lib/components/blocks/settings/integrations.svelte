<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';

	import * as Accordion from '$lib/components/ui/accordion';
	import * as Item from '$lib/components/ui/item';
	import { m } from '$lib/paraglide/messages';

	import ConfigUmami from './config-umami.svelte';
	import ConfigVtapi from './config-vtapi.svelte';
	const { host }: { host: THost } = $props();
</script>

<Item.Root class="min-h-24 w-full p-0" size="sm">
	<Item.Root variant="outline" size="sm" class="min-h-24 w-full p-0">
		<Item.Content class="h-full">
			<Accordion.Root type="single" class="w-full">
				<Accordion.Item value="watchlist" class="p-0">
					<Accordion.Trigger class="group min-h-24 px-4 no-underline!">
						<div class="flex flex-col gap-1">
							<span>{m.control_integrations()}</span>
							<span class="max-w-md @xl:text-xs text-balance text-muted-foreground">
								<!-- eslint-disable-next-line svelte/no-at-html-tags -->
								{@html m.control_integrations_helper()}</span
							>
						</div>
					</Accordion.Trigger>
					<Accordion.Content class="w-full border-t p-0">
						<Accordion.Root type="single">
							<Accordion.Item value="umami" class="px-4">
								<Accordion.Trigger class="no-underline!">Umami</Accordion.Trigger>
								<Accordion.Content>
									<ConfigUmami {host} />
								</Accordion.Content>
							</Accordion.Item>
							<Accordion.Item value="vtapi" class="px-4">
								<Accordion.Trigger class="no-underline!">VirusTotal API</Accordion.Trigger>
								<Accordion.Content>
									<ConfigVtapi {host} />
								</Accordion.Content>
							</Accordion.Item>
						</Accordion.Root>
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</Item.Content>
	</Item.Root>
</Item.Root>
