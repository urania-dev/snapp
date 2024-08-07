<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { outside } from '$lib/utils/outside';
	import type { Snippet } from 'svelte';

	const {
		children,
		css,
		outside: outsideCallback = () => {}
	}: { children?: Snippet; outside?: Function; css?: { [key: string]: string } } = $props();
</script>

<div
	use:outside={outsideCallback}
	class={cn(
		'flex w-full flex-col items-center gap-2 rounded border border-slate-500/25 bg-slate-500/5 p-4 transition-all',
		css?.['card']
	)}
>
	{@render children?.()}
</div>
