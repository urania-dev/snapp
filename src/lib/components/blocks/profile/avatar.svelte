<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import * as ImageCropper from '$lib/components/blocks/image-cropper';
	import { getFileFromUrl } from '$lib/components/blocks/image-cropper';
	import * as Field from '$lib/components/ui/field';
	import { m } from '$lib/paraglide/messages';
	import { saveAvatar } from '$lib/remotes/auth.remote';
	import { getHost } from '$lib/remotes/config.remote';
	import { toast } from 'svelte-sonner';
	let { src = $bindable('') }: { src?: string } = $props();
	const convertToWebPDataUrl = async (
		file: File,
		options: { maxHeight?: number; maxWidth?: number; quality?: number } = {}
	) => {
		const { maxHeight = 250, maxWidth = 250, quality = 0.8725 } = options;
		const img = await createImageBitmap(file);
		let { height, width } = img;
		const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
		if (ratio < 1) {
			width = Math.round(width * ratio);
			height = Math.round(height * ratio);
		}
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(img, 0, 0, width, height);
		return canvas.toDataURL('image/webp', quality);
	};
</script>

{#snippet cropper()}
	<ImageCropper.Root
		class="size-20!"
		bind:src
		onCropped={async (url) => {
			try {
				const file = await getFileFromUrl(url);
				const webp = await convertToWebPDataUrl(file);
				const { filename: image } = await saveAvatar(webp);
				const host = await getHost();
				const authClient = getAuthClient(host.origin, page.data.fetch);
				await authClient.updateUser({
					image
				});
				await invalidateAll();
				toast.success(m.profile_updated());
			} catch (error) {
				console.error(error);
				toast.error(m.errors_upload_avatar_error());
			}
		}}
	>
		<ImageCropper.UploadTrigger>
			<ImageCropper.Preview />
		</ImageCropper.UploadTrigger>
		<ImageCropper.Dialog>
			<ImageCropper.Cropper />
			<ImageCropper.Controls>
				<ImageCropper.Crop />
				<ImageCropper.Cancel />
			</ImageCropper.Controls>
		</ImageCropper.Dialog>
	</ImageCropper.Root>
{/snippet}
<Field.Field class="flex flex-col items-center gap-4 md:flex-row">
	<div class="size-20!">
		{@render cropper()}
	</div>
	<Field.Content class="flex flex-col gap-1 leading-1">
		<Field.Label class="mb-1 text-base font-bold">{m.avatar()}</Field.Label>
		<Field.Description class="mb-0 @xl:text-xs">{m.avatar_description()}</Field.Description>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		<Field.Description class="mt-0 @xl:text-xs">{@html m.avatar_location()}</Field.Description>
	</Field.Content>
</Field.Field>
