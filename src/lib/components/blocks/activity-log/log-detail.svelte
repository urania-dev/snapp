<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { m } from '$lib/paraglide/messages';

	import { buttonVariants } from '../button';
	import Code from '../code/code.svelte';
	import CopyButton from '../copy-button/copy-button.svelte';
	const { code }: { code: string } = $props();
</script>

<Popover.Root>
	<Popover.Trigger class={buttonVariants({ class: 'h-7 me-2 text-sm', variant: 'outline' })}
		>{m.details()}</Popover.Trigger
	>
	<Popover.Content
		align="end"
		alignOffset={-6}
		class="p-2 relative max-w-xs bg-transparent border-none"
		><div class="flex gap-2">
			<Code class="h-full pe-2 whitespace-pre-wrap" {code} />
			<CopyButton class="absolute end-3 top-3" text={code} />
		</div>
	</Popover.Content>
</Popover.Root>
