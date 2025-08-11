<script lang="ts">
	import { page } from '$app/state';
	import P from '$lib/components/typography/text/p.svelte';
	import { Button } from '$lib/components/ui/button';
	import { getTranslations } from '$lib/i18n/index.svelte';

	const f = $derived(page.data.fetch as typeof fetch);
	const checkCSV = async () => {
		try {
			const res = await (await f('/admin/check-export/' + page.data.user.id)).json();
			if (res.available) ready = true;
			else ready = false;
		} catch (error) {
			console.error(error);
		}
	};

	const i18n = getTranslations();

	let ready = $state(false);
</script>

{#await checkCSV()}
	<div class="flex h-full w-full animate-spin items-center justify-center duration-1000">
		<div class="grid h-6 w-6 place-content-center">
			<i class="ph ph-spinner text-[24px]"></i>
		</div>
	</div>
{:then}
	{#if !ready}
		<div
			class="m-auto my-8 flex h-full w-full max-w-6 animate-spin items-center justify-center duration-1000"
		>
			<div class="grid h-6 w-6 place-content-center">
				<i class="ph ph-spinner text-[24px]"></i>
			</div>
		</div>
		<div class="mt-4 grid w-full gap-1 text-center">
			<P class="w-full text-center text-sm text-muted-foreground"
				>{i18n.t('migrations.exporting')}</P
			>
		</div>
	{:else}
		<div class="flex h-full w-full flex-col items-center justify-center">
			<P class="py-8 text-sm text-muted-foreground"
				>{i18n.t('migrations.available-for-10-minutes')}</P
			>
			<div class="flex w-full gap-4">
				<Button
					variant="outline"
					class="max-w-max"
					onclick={async () => {
						const url = '/admin/refresh-export/' + page.data.user.id;
						const res = await (await f(url)).json();
						if (res.success) ready = false;
					}}
				>
					<span> {i18n.t('globals.refresh')}</span>
					<i class="ph ph-arrows-clockwise"></i>
				</Button>
				<Button href={'/admin/download-export/' + page.data.user.id} class="max-w-max" download>
					<span>
						{i18n.t('globals.download')}
					</span>
					<i class="ph-duotone ph-file-csv text-[20px]"></i>
				</Button>
			</div>
		</div>
	{/if}
{/await}
