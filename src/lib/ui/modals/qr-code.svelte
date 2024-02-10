<script lang="ts">
	import { getLocale } from '$lib/i18n';
	import QrCode from 'qrcode';
	import DownloadIcon from 'lucide-svelte/icons/download';
	import { onMount } from 'svelte';
	import { Small } from '../typography';
	import { env } from '$env/dynamic/public';
	export let url: string;

	let imageData: string;
	onMount(async () => {
		imageData = await QrCode.toDataURL(url, { type: 'image/webp', width: 400 });
	});

	const { t } = getLocale();

	function handle_download() {
		let link = document.createElement('a');
		link.href = imageData;
		link.target = '_blank';
		link.download = `${url.split(env.PUBLIC_URL + '/')[1]}.webè`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<div class="flex p-4 container max-w-sm card variant-ghost-surface flex-col gap-4">
	<img src={imageData} class="w-full aspect-auto rounded-token" alt="qrCode" />
	<button
		class="btn h-10 variant-filled-primary flex gap-2 max-w-max mx-auto"
		on:click={handle_download}
	>
		<DownloadIcon class="w-4 h-4" />
		<Small class="font-semibold">
			{$t('snapps:qrcode:download')}
		</Small>
	</button>
</div>
