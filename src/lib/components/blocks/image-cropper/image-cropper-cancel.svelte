<script lang="ts">
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button, type ButtonElementProps } from '$lib/components/blocks/button';

	import { useImageCropperCancel } from './image-cropper.svelte.ts';
	let {
		onclick,
		ref = $bindable(null),
		size = 'sm',
		variant = 'outline',
		...rest
	}: ButtonElementProps = $props();
	const cancelState = useImageCropperCancel();
</script>

<Button
	{...rest}
	bind:ref
	{size}
	{variant}
	onclick={(
		e: {
			currentTarget: EventTarget & HTMLButtonElement;
		} & MouseEvent
	) => {
		onclick?.(e);
		cancelState.onclick();
	}}
>
	<Trash2Icon />
	<span>Cancel</span>
</Button>
