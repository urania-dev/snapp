<script lang="ts">
	import type { ImageCropperUploadTriggerProps } from './types';

	import { useImageCropperTrigger } from './image-cropper.svelte.ts';

	let { children, ref = $bindable(null), ...rest }: ImageCropperUploadTriggerProps = $props();
	const triggerState = useImageCropperTrigger();
</script>

<label {...rest} bind:this={ref} for={triggerState.rootState.id} class="hover:cursor-pointer">
	{@render children?.()}
</label>
