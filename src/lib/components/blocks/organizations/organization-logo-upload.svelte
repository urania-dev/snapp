<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import * as ImageCropper from '$lib/components/blocks/image-cropper';
	import { getFileFromUrl } from '$lib/components/blocks/image-cropper';
	import * as Field from '$lib/components/ui/field';
	import { m } from '$lib/paraglide/messages';
	import { getHost } from '$lib/remotes/config.remote';
	import { saveLogo } from '$lib/remotes/organizations.remote';
	import { toast } from 'svelte-sonner';
	let { organizationId, src = $bindable('') }: { organizationId: string; src?: string } = $props();
	const convertToWebPDataUrl = async (
		file: File,
		options: { maxHeight?: number; maxWidth?: number; quality?: number } = {}
	) => {
		const { maxHeight = 250, maxWidth = 250, quality = 0.8725 } = options;
		const targetSize = Math.min(maxWidth, maxHeight);

		const canvas = document.createElement('canvas');
		canvas.width = targetSize;
		canvas.height = targetSize;

		const ctx = canvas.getContext('2d')!;
		ctx.clearRect(0, 0, targetSize, targetSize);

		const svgToDataUri = (svg: string): string => {
			const bytes = new TextEncoder().encode(svg);
			let bin = '';
			for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
			return `data:image/svg+xml;base64,${btoa(bin)}`;
		};

		if (file.type === 'image/svg+xml') {
			const svgText = await file.text();
			const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
			const svgEl = doc.documentElement;

			if (svgEl.nodeName.toLowerCase() !== 'svg') throw new Error('Invalid SVG');

			if (!svgEl.getAttribute('xmlns')) svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
			svgEl.setAttribute('overflow', 'hidden');

			const vb = svgEl
				.getAttribute('viewBox')
				?.trim()
				.split(/\s+/)
				.map((v) => Number(v));

			if (!vb || vb.length !== 4 || vb.some((n) => Number.isNaN(n)))
				throw new Error('SVG without viewBox');

			const [, , vbWidth, vbHeight] = vb;

			const scale = Math.min(targetSize / vbWidth, targetSize / vbHeight, 1);
			const drawWidth = Math.max(1, Math.round(vbWidth * scale));
			const drawHeight = Math.max(1, Math.round(vbHeight * scale));

			const normalizedSvg = new XMLSerializer().serializeToString(svgEl);
			const svgDataUri = svgToDataUri(normalizedSvg);

			const svgBlob = await (await fetch(svgDataUri)).blob();
			const bitmap = await createImageBitmap(svgBlob, {
				resizeHeight: drawHeight,
				resizeWidth: drawWidth
			});

			const dx = Math.floor((targetSize - drawWidth) / 2);
			const dy = Math.floor((targetSize - drawHeight) / 2);

			ctx.drawImage(bitmap, dx, dy, drawWidth, drawHeight);
			return canvas.toDataURL('image/webp', quality);
		}

		const bitmap = await createImageBitmap(file);

		const scale = Math.min(targetSize / bitmap.width, targetSize / bitmap.height, 1);
		const drawWidth = Math.max(1, Math.round(bitmap.width * scale));
		const drawHeight = Math.max(1, Math.round(bitmap.height * scale));

		const dx = Math.floor((targetSize - drawWidth) / 2);
		const dy = Math.floor((targetSize - drawHeight) / 2);

		ctx.drawImage(bitmap, dx, dy, drawWidth, drawHeight);
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
				const { filename: image } = await saveLogo({ file: webp, id: organizationId });
				const host = await getHost();
				const authClient = getAuthClient(host.origin, page.data.fetch);
				await authClient.organization.update({
					data: {
						logo: image
					},
					organizationId
				});
				await invalidateAll();
				toast.success(m.settings_saved());
			} catch (error) {
				console.error(error);
				toast.error(m.errors_settings_saving());
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
		<Field.Label class="mb-1 text-base font-bold">{m.logo()}</Field.Label>
		<Field.Description class="mb-0 ">{m.logo_description()}</Field.Description>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	</Field.Content>
</Field.Field>
