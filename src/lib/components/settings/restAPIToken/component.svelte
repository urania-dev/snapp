<script lang="ts">
	import type { Token } from '@prisma/client';

	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import P from '$lib/components/typography/text/p.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Separator } from '$lib/components/ui/separator';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import { toast } from 'svelte-sonner';
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';

	const i18n = getTranslations();
	let { sampleCode, stored, token }: { sampleCode: string; stored: null | Token; token?: string } =
		$props();
	let showToken = $state(false);
</script>

<div class="grid h-max w-full grid-cols-1 gap-2 md:gap-4">
	<P class="text-sm leading-normal">{@html i18n.t('tokens.helper')}</P>

	<Label class="mt-4">{i18n.t('tokens.fields.key')}</Label>
	<div class="flex flex-col gap-1">
		<div class="flex items-center gap-2">
			<Input
				icon="key"
				type={showToken ? 'text' : 'password'}
				class="caret-transparent"
				readonly
				bind:value={token}
				placeholder={i18n.t('tokens.placeholder')}
			/>
			<Button
				variant="outline"
				size="icon"
				class="aspect-square"
				onclick={() => {
					showToken = !showToken;
				}}><i class="ph ph-{showToken ? 'eye' : 'eye-closed'} text-[20px]"></i></Button
			>
			<Button
				variant="outline"
				size="icon"
				class="aspect-square"
				onclick={async () => {
					if (!browser || !token || !navigator.clipboard || page.url.protocol !== 'https:') {
						toast.error(i18n.t('tokens.not-allowed-to-copy'));
						return;
					}

					await navigator.clipboard.writeText(token);
					toast.error(i18n.t('tokens.copied'));
				}}><i class="ph-duotone ph-copy text-[20px]"></i></Button
			>
		</div>
		<div class="flex h-max w-full flex-col">
			{#key stored}
				<small
					class="text-semibold px-2 text-xs text-muted-foreground"
					class:text-transparent={stored === null}
					in:fly={{
						duration: 400,
						opacity: prefersReducedMotion.current ? 1 : 0,
						y: prefersReducedMotion.current ? 0 : 4
					}}
					>{@html i18n.t('tokens.fields.created')}
					{stored?.createdAt.toUTCString()}</small
				>
			{/key}
		</div>
		{#if stored}
			<form action="?/tokenRevoke" class="contents" method="post" use:enhance>
				<Button
					variant="outline"
					type="submit"
					class="mt-4 justify-start transition-all hover:bg-red-500 hover:text-white hover:dark:bg-red-700"
				>
					{@html i18n.t('tokens.revoke')}
				</Button>
			</form>
		{:else}
			<form action="?/tokenGenerate" class="contents" method="post" use:enhance>
				<Button type="submit" class="mt-4 justify-start">
					{@html i18n.t('tokens.generate')}
				</Button>
			</form>
		{/if}
		<div class="mt-4 flex w-full overflow-clip overflow-x-scroll">
			{@html sampleCode}
		</div>
		<Separator class="mt-4" />
		<div class="mt-4">
			<P class="text-sm text-muted-foreground">
				{@html i18n.t('tokens.api-docs', { url: '/docs' })}
			</P>
		</div>
	</div>
</div>
