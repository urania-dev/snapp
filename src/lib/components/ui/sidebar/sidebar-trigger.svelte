<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils';

	import { useSidebar } from './context.svelte.js';

	let {
		class: className,
		onclick,
		ref = $bindable(null),
		// eslint-disable-next-line svelte/valid-compile
		...restProps
	}: {
		onclick?: (e: MouseEvent) => void;
	} & ComponentProps<typeof Button> = $props();

	const sidebar = useSidebar();
</script>

<Button
	type="button"
	onclick={(e) => {
		onclick?.(e);
		sidebar.toggle();
	}}
	data-sidebar="trigger"
	variant="ghost"
	size="icon"
	class={cn('h-10 w-10', className)}
	{...restProps}
>
	<i class="ph ph-sidebar text-[20px]"></i>
	<span class="sr-only">Toggle Sidebar</span>
</Button>
