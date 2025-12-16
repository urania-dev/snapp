<script lang="ts">
	import { cn } from '$lib/utils';

	import type { ImageCropperControlsProps } from './types';
	let {
		children,
		class: className,
		ref = $bindable(null),
		...rest
	}: ImageCropperControlsProps = $props();
</script>

<div
	{...rest}
	bind:this={ref}
	class={cn('flex w-full place-items-center justify-center gap-2', className)}
>
	{@render children?.()}
</div>
