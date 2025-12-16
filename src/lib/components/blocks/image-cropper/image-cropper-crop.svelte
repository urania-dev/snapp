<script lang="ts">
	import CropIcon from '@lucide/svelte/icons/crop';
	import { Button, type ButtonElementProps } from '$lib/components/blocks/button';

	import { useImageCropperCrop } from './image-cropper.svelte.ts';
	let {
		onclick,
		ref = $bindable(null),
		size = 'sm',
		variant = 'default',
		...rest
	}: ButtonElementProps = $props();
	const cropState = useImageCropperCrop();
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
		cropState.onclick();
	}}
>
	<CropIcon />
	<span>Crop</span>
</Button>
