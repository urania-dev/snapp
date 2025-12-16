<script lang="ts">
	import InfoIcon from '@lucide/svelte/icons/info';
	import * as Code from '$lib/components/blocks/code';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { m } from '$lib/paraglide/messages';
	import { fade } from 'svelte/transition';

	import { CopyButton } from '../copy-button';

	const { config }: { config: string } = $props();
</script>

<div class="flex h-full min-h-[200px] w-full flex-col gap-4">
	<InputGroup.Root class="h-full grow">
		<InputGroup.Addon align="block-start" class="h-12! border-b">
			<InputGroup.Text class="font-medium">
				{m.host_conf()}
			</InputGroup.Text>
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<InputGroup.Button {...props} class="ms-auto rounded-full" size="icon-xs">
							<InfoIcon />
						</InputGroup.Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content align="end">{m.read_only()}</Tooltip.Content>
			</Tooltip.Root>
			<CopyButton text={config || ''} />
		</InputGroup.Addon>
		{#key config}
			<div class="h-full min-h-[200px] w-full border-0 flex flex-col" in:fade|global>
				<Code.Root
					lang="yaml"
					class="h-full min-h-[200px] w-full border-0"
					hideLines={!config}
					code={config || '...'}
				/>
			</div>
		{/key}
	</InputGroup.Root>
</div>
