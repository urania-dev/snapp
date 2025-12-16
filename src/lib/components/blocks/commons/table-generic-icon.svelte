<script lang="ts">
	import UserRound from '@lucide/svelte/icons/user-round';
	import * as Tooltip from '$lib/components/ui/tooltip';

	import { buttonVariants } from '../button';

	const {
		class: classes,
		disabled = false,
		Icon,
		iconClass,
		message,
		variant = 'outline'
	}: {
		class?: string;
		disabled?: boolean;
		Icon: typeof UserRound;
		iconClass?: string;
		message: string;
		variant: 'default' | 'ghost' | 'outline';
	} = $props();
</script>

<div>
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger {disabled} class={[buttonVariants({ class: `h-7 ${classes}`, variant })]}>
				<Icon class={['size-4', iconClass]} />
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>{message}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
</div>
