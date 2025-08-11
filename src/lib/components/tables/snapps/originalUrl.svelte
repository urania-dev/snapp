<script lang="ts">
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { cn } from '$lib/utils';

	const { url }: { url: null | string } = $props();

	let openTooltip = $state(false);
</script>

<div class="flex w-full justify-center">
	<Tooltip.Provider>
		<Tooltip.Root delayDuration={300} bind:open={openTooltip}>
			<Tooltip.Trigger
				onclick={() => {
					if (url) window.open(url, '_blank');
				}}
				onmouseleave={() => {
					setTimeout(() => {
						if (openTooltip) openTooltip = false;
					}, 500);
				}}
				class={cn(buttonVariants({ variant: 'ghost' }), ' h-6 p-0.5 px-1')}
				disabled={url === null}
			>
				<span>{url?.slice(0, 30)}...</span>
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>{url}</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
</div>
