<script lang="ts">
	import { useId } from 'bits-ui';
	import { onDestroy } from 'svelte';
	import { box } from 'svelte-toolbelt';

	import type { ImageCropperRootProps } from './types';

	import { useImageCropperRoot } from './image-cropper.svelte.ts';

	let {
		children,
		id = useId(),
		onCropped = () => {},
		onUnsupportedFile = () => {},
		src = $bindable(''),
		...rest
	}: ImageCropperRootProps = $props();
	const rootState = useImageCropperRoot({
		id: box.with(() => id),
		onCropped: box.with(() => onCropped),
		onUnsupportedFile: box.with(() => onUnsupportedFile),
		src: box.with(
			() => src,
			(v) => (src = v)
		)
	});
	onDestroy(() => rootState.dispose());
</script>

{@render children?.()}
<input
	{...rest}
	onchange={(e) => {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		rootState.onUpload(file);
		// reset so that we can reupload the same file
		(e.target! as HTMLInputElement).value = '';
	}}
	type="file"
	{id}
	style="display: none;"
/>
