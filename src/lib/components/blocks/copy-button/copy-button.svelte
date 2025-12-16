<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import XIcon from '@lucide/svelte/icons/x';
	import { Button } from '$lib/components/blocks/button';
	import { UseClipboard } from '$lib/hooks/use-clipboard.svelte';
	import { cn } from '$lib/utils';
	import { scale } from 'svelte/transition';

	import type { CopyButtonProps } from './types';
	let {
		animationDuration = 500,
		children,
		class: className,
		icon,
		onCopy,
		ref = $bindable(null),
		size = 'icon',
		tabindex = -1,
		text,
		variant = 'ghost',
		...rest
	}: CopyButtonProps = $props();
	// this way if the user passes text then the button will be the default size
	// svelte-ignore state_referenced_locally
	if (size === 'icon' && children) {
		size = 'default';
	}
	const clipboard = new UseClipboard();
</script>

<Button
	{...rest}
	bind:ref
	{variant}
	{size}
	{tabindex}
	class={cn('flex items-center gap-2', className)}
	type="button"
	name="copy"
	onclick={async () => {
		const status = await clipboard.copy(text);
		onCopy?.(status);
	}}
>
	{#if clipboard.status === 'success'}
		<div in:scale={{ duration: animationDuration, start: 0.85 }}>
			<CheckIcon tabindex={-1} />
			<span class="sr-only">Copied</span>
		</div>
	{:else if clipboard.status === 'failure'}
		<div in:scale={{ duration: animationDuration, start: 0.85 }}>
			<XIcon tabindex={-1} />
			<span class="sr-only">Failed to copy</span>
		</div>
	{:else}
		<div in:scale={{ duration: animationDuration, start: 0.85 }}>
			{#if icon}
				{@render icon()}
			{:else}
				<CopyIcon tabindex={-1} />
			{/if}
			<span class="sr-only">Copy</span>
		</div>
	{/if}
	{@render children?.()}
</Button>
