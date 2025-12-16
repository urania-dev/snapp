<script lang="ts">
	import Cropper from 'svelte-easy-crop';

	import type { ImageCropperCropperProps } from './types';

	import { useImageCropperCropper } from './image-cropper.svelte.ts';

	let {
		aspect = 1,
		cropShape = 'rect',
		showGrid = true,
		...rest
	}: ImageCropperCropperProps = $props();
	const cropperState = useImageCropperCropper();
</script>

<!-- This needs to be relative https://github.com/ValentinH/svelte-easy-crop#basic-usage -->
<div class="relative h-full w-full">
	<Cropper
		{...rest}
		{cropShape}
		{aspect}
		{showGrid}
		image={cropperState.rootState.tempUrl}
		oncropcomplete={cropperState.onCropComplete}
	/>
</div>
