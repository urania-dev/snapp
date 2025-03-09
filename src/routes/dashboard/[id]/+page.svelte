<script lang="ts">
	import { browser } from '$app/environment';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { TagSelector, UTMParams } from '$lib/components/snapps';
	import Graph from '$lib/components/snapps/graph.svelte';
	import H2 from '$lib/components/typography/heading/h2.svelte';
	import P from '$lib/components/typography/text/p.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { setMetricsStore } from '$lib/stores/metrics.svelte.js';
	import { LocalStorage } from '$lib/stores/storage.svelte';
	import { cn, formatTimeAgo } from '$lib/utils';
	import { decode } from 'html-entities';
	import { toast } from 'svelte-sonner';
	import { SvelteMap } from 'svelte/reactivity';

	const { data } = $props();
	const i18n = getTranslations();

	let secureContext = $derived(browser && navigator.clipboard && page.url.protocol === 'https:');
	let showGraph = new LocalStorage('showgraph', true);
	let enabled = $derived(data.snapp?.disabled !== true);

	let tags = $state<string[]>(data.snapp?.tag?.map((t) => t.slug) || []);

	let utmParams = $state(
		new SvelteMap<
			string,
			{
				key: string;
				name: string;
				value: string;
			}
		>(
			JSON.parse(data.snapp?.utmParams || '[]').map((utm: string) => {
				const [key, value, name] = JSON.parse(utm);
				return [
					key,
					{
						key,
						name,
						value
					}
				];
			})
		)
	);
	const loadQRCode = async () => {
		const idx = data.snapp?.shortcode;
		const withPrefix = page.url.origin + '/' + idx;
		const url = new URL(withPrefix);
		url.protocol = page.url.protocol;
		try {
			const qrcode = await (await data.fetch(`/qrcode/${url}`)).text();
			return qrcode;
		} catch (err) {
			console.error(err);
		}
		return '';
	};

	setMetricsStore();
</script>

<div class="flex w-full flex-col">
	<div class="flex w-full items-center justify-between px-4">
		<div class="flex h-20 shrink-0 items-center gap-2">
			<i class="ph-duotone ph-link-simple-horizontal text-[32px]"></i>
			<H2 class="m-0 p-0 uppercase">{data.snapp?.shortcode}</H2>
		</div>
		<div class="flex gap-2">
			<Dialog.Root>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button {...props} class="h-9 min-w-9">
							<i class="ph-duotone ph-qr-code text-[20px]"></i>
							<span class="hidden lg:block">
								{i18n.t('globals.qrcode')}
							</span>
						</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content class="max-w-sm">
					<Dialog.Header>
						<Dialog.Title>QR Code</Dialog.Title>
					</Dialog.Header>
					<div class="flex w-full justify-between gap-4">
						{#await loadQRCode()}
							<div
								class="grid h-full w-full animate-spin place-content-center justify-center duration-1000"
							>
								<div class="flex h-10 w-10 items-center justify-center">
									<i class="ph ph-spinner text-[50px]"></i>
								</div>
							</div>
						{:then qrcode}
							<div
								id="qrcode-holder"
								class="grid aspect-square w-full overflow-clip rounded opacity-75 dark:invert"
							>
								{#if qrcode?.trim() !== ''}
									{@html decode(qrcode)}
								{:else}
									{i18n.t('errors.generic')}
								{/if}
							</div>
						{/await}
					</div>
					<div class="grid gap-2">
						<div class="grid grid-cols-2 gap-2">
							<Button
								variant="outline"
								class="h-9 w-full"
								target="_blank"
								download="{data.snapp?.shortcode}.svg"
								title={data.snapp?.shortcode}
								href={`/qrcode/${page.url.origin + '/' + data.snapp?.shortcode}`}
							>
								<i class="ph-duotone ph-file-svg text-[20px]"></i>
								<span class="text-sm">{i18n.t('globals.download')}</span>
							</Button>
							<Button
								variant="outline"
								class="h-9 w-full"
								onclick={async () => {
									const canvas = document.createElement('canvas');
									const ctx = canvas.getContext('2d');
									const img = document.getElementById('qrcode-holder')?.firstChild as Node;
									if (!img || !ctx) return;
									const svgData = new XMLSerializer().serializeToString(img);
									const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
									const svgUrl = URL.createObjectURL(svgBlob);
									const image = new Image();
									image.onload = function () {
										canvas.width = 500;
										canvas.height = 500;
										ctx.clearRect(0, 0, canvas.width, canvas.height);
										ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

										// Convert canvas to PNG and trigger download
										const pngUrl = canvas.toDataURL('image/png');
										const a = document.createElement('a');
										a.title = data.snapp?.shortcode;
										a.download = `${data.snapp?.shortcode}.png`;
										a.href = pngUrl;
										a.click();
									};
									image.src = svgUrl;
								}}
							>
								<i class="ph-duotone ph-file-png text-[20px]"></i>
								<span class="text-sm">{i18n.t('globals.download')}</span>
							</Button>
						</div>
						<Dialog.Close class={cn(buttonVariants({ class: 'mt-0 h-9', variant: 'outline' }))}>
							<i class="ph ph-x text-[18px]"></i>
							<span class="text-sm">{i18n.t('globals.close')}</span>
						</Dialog.Close>
					</div>
				</Dialog.Content>
			</Dialog.Root>

			<Button
				onclick={async (e) => {
					e.stopPropagation();
					e.preventDefault();
					const idx = data.snapp?.shortcode;
					if (!secureContext) {
						toast.error(i18n.t('tokens.not-allowed-to-copy'));
						return;
					}

					const withPrefix = page.url.origin + '/' + idx;
					if (idx && navigator.clipboard) await navigator.clipboard.writeText(withPrefix);
					toast.info(i18n.t('snapps.helpers.copied-to-clipboard'));
				}}
				class="h-9"
			>
				<i class="ph-duotone ph-copy text-[20px]"></i>
				<span class="hidden lg:block">
					{i18n.t('globals.copy')}
				</span>
			</Button>
			<Button
				data-sveltekit-preload-data="off"
				href={page.url.origin + '/' + data.snapp?.shortcode}
				target="_blank"
				class="h-9"
			>
				<i class="ph-duotone ph-arrow-square-out text-[20px]"></i>
				<span class="hidden lg:block">
					{i18n.t('snapps.labels.open-link')}
				</span>
			</Button>
		</div>
	</div>
</div>

<Separator />
<div
	class="grid-details grid h-full max-h-[calc(100%_-_8.65rem)] w-full max-w-[calc(100%_-_1px)] grid-rows-[repeat(2,1fr)] content-start overflow-y-scroll xl:grid-cols-2"
>
	<div class="flex h-max w-full flex-col gap-4" style:grid-area="graph">
		<div class="grid h-max border-b {showGraph.current ? 'pb-[2px]' : 'pb-0'} pt-0">
			<div class="flex w-full items-center justify-between px-2 py-1">
				<Label class="ps-2 text-base">
					{i18n.t('snapps.fields.hit')}
				</Label>

				<Button
					class="h-8 w-8"
					variant="ghost"
					onclick={() => (showGraph.current = !showGraph.current)}
				>
					{#if showGraph.current}
						<i class="ph ph-eye text-[20px]"></i>
					{:else}
						<i class="ph ph-eye-closed text-[20px]"></i>
					{/if}
				</Button>
			</div>
			<Separator class={showGraph.current ? '' : 'hidden'} />

			{#if showGraph.current}
				<Graph snappId={data.snapp?.id} />
			{/if}
		</div>
	</div>
	<div class="flex h-full w-full flex-col gap-4" style:grid-area="notes">
		<div class="flex h-full flex-col pb-2 pt-0">
			<Label class="shrink-y-0 flex h-10 items-center px-4 py-1 text-base">
				{i18n.t('snapps.fields.notes')}
			</Label>
			<Separator />
			<div class="flex h-full flex-col p-2">
				<Textarea class="mb-auto h-full" value={data.snapp?.notes} disabled></Textarea>
			</div>
		</div>
	</div>
	<div
		class="flex h-full w-full auto-rows-max flex-col border-0 border-b lg:!border-b-0 lg:border-l"
		style:grid-area="details"
	>
		<div class="p-0">
			<Label class="shrink-y-0 flex h-10 items-center px-3 py-1 text-base">
				{i18n.t('snapps.labels.details')}
			</Label>
			<Separator />
		</div>
		<div class="flex items-start justify-between py-4 first-of-type:mt-0 lg:py-2">
			<div class="flex w-full flex-col gap-2 px-2">
				<Label for="status" class="grid cursor-pointer gap-2 ps-1">
					<P class="text-sm font-semibold"
						>{i18n.t('snapps.fields.status')}: [
						<span
							class="text-xs"
							class:text-red-500={data.snapp?.disabled === true}
							class:text-green-500={data.snapp?.disabled === false}
							>{i18n.t(data.snapp?.disabled ? 'globals.disabled' : 'globals.active')}</span
						> ]</P
					>
					<P class="!m-0 max-w-[50ch] text-balance text-xs leading-normal text-muted-foreground">
						{decode(i18n.t('snapps.helpers.disable-text-1'))}
					</P>
				</Label>
			</div>
			<div class="flex items-center px-2 py-4 lg:py-2">
				<Switch
					id="status"
					checked={enabled}
					onCheckedChange={async (state) => {
						const disabled = !state;
						const f = data.fetch;
						await (
							await f(`/api/snapp/update`, {
								body: JSON.stringify({ data: { disabled }, where: { id: data.snapp?.id } }),
								method: 'PATCH'
							})
						).json();
						await invalidateAll();
					}}
				/>
			</div>
		</div>
		<Separator />

		<div class="grid gap-2 px-1 py-4 pe-2 lg:py-2">
			<Label class="px-2	">{i18n.t('snapps.fields.original-url')}</Label>
			<Input disabled icon="globe-simple" value={data.snapp?.originalUrl} />
		</div>
		<Separator />

		<div class="grid gap-2 px-1 py-4 pe-2 lg:py-2">
			<Label class="w-full px-2">{i18n.t('snapps.fields.shortcode')}</Label>
			<Input disabled icon="link-simple-horizontal" value={data.snapp?.shortcode} />
		</div>
		<Separator />

		<div class="grid gap-2 px-1 py-4 pe-2 lg:py-2">
			<Label class="w-full px-2">{i18n.t('snapps.fields.secret')}</Label>
			<Input
				disabled
				class="!text-[11px] font-semibold uppercase {data.snapp?.secret
					? 'text-red-500/85'
					: 'text-muted-foreground'}"
				icon="lock"
				value={data.snapp?.secret !== null
					? i18n.t('snapps.helpers.secret')
					: i18n.t('snapps.helpers.not-secret')}
			/>
		</div>
		<Separator />

		<div class="grid grid-cols-3 gap-2 px-1 py-4 pe-2 lg:py-2">
			<div class="grid w-full gap-2">
				<Label class="w-full px-2">{i18n.t('snapps.fields.hit')}</Label>
				<Input
					disabled
					class="!text-[11px] font-semibold uppercase text-muted-foreground"
					icon="lock"
					value={data.snapp?.hit}
				/>
			</div>
			<div class="grid w-full gap-2">
				<Label class="w-full px-2">{i18n.t('snapps.fields.used')}</Label>
				<Input
					disabled
					class="!text-[11px] font-semibold uppercase text-muted-foreground"
					icon="lock"
					value={data.snapp?.maxUsages === -1
						? i18n.t('snapps.helpers.not-max-usages')
						: data.snapp?.maxUsages}
				/>
			</div>
			<div class="grid w-full gap-2">
				<Label class="w-full px-2">{i18n.t('snapps.fields.max-usages')}</Label>
				<Input
					disabled
					class="!text-[11px] font-semibold uppercase text-muted-foreground"
					icon="lock"
					value={data.snapp?.maxUsages === -1
						? i18n.t('snapps.helpers.not-max-usages')
						: data.snapp?.maxUsages}
				/>
			</div>
		</div>
		<Separator />

		<div class="grid grid-cols-2 gap-1 px-1 py-4 pe-2 lg:py-2">
			<div class="grid w-full gap-2">
				<Label class="w-full px-2">{i18n.t('snapps.fields.created')}</Label>
				<Input
					disabled
					class="!text-[11px] font-semibold uppercase text-muted-foreground"
					icon="clock"
					value={formatTimeAgo(data.snapp?.createdAt, page.data.locale)}
				/>
			</div>
			<div class="grid w-full gap-2 ps-2">
				<Label class="w-full px-2">{i18n.t('snapps.fields.expiration')}</Label>
				<Input
					disabled
					class="!text-[11px] font-semibold uppercase text-muted-foreground"
					icon="alarm"
					value={data.snapp?.expiresAt
						? formatTimeAgo(data.snapp?.expiresAt, page.data.locale)
						: i18n.t('globals.disabled')}
				/>
			</div>
		</div>
		<Separator />
		<div class="grid h-full gap-2 lg:grid-cols-2">
			<div class="flex h-full w-full flex-col gap-2 px-1 py-4 xl:py-2">
				<Label class="h-max w-full px-2">{i18n.t('menu.tags')}</Label>
				<TagSelector showTrigger={false} bind:tags />
			</div>
			<div
				class="flex h-full w-full flex-col content-start gap-2 border-t px-0 py-4 xl:border-l xl:border-t-0 xl:py-2"
			>
				<Label class="w-full px-3">{i18n.t('snapps.labels.utm-params')}</Label>
				<UTMParams showHelper={false} showFooter={false} bind:params={utmParams} />
			</div>
		</div>
	</div>
</div>

<style>
	@media (min-width: 1280px) {
		.grid-details {
			grid-template-areas: 'graph details' 'notes details';
		}
	}
	@media (max-width: 1280px) {
		.grid-details {
			grid-template-areas: 'graph' 'details' 'notes';
		}
	}
</style>
