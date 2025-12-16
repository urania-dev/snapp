<script lang="ts">
	import { CopyButton } from '$lib/components/blocks/copy-button';
	import { cn } from '$lib/utils';

	import type { CodeCopyButtonProps } from './types';

	import { useCodeCopyButton } from './code.svelte.ts';

	let {
		class: className,
		ref = $bindable(null),
		size = 'icon',
		variant = 'ghost',
		...rest
	}: CodeCopyButtonProps = $props();
	const copyButton = useCodeCopyButton();
</script>

<CopyButton
	class={cn('absolute top-2 right-2', className)}
	text={copyButton.code}
	{variant}
	{size}
	{...rest}
/>
