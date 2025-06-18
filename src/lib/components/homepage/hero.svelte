<script>
	import { page } from '$app/state';
	import { IsMobile } from '$lib/hooks/is-mobile.svelte';
	import { getTranslations } from '$lib/i18n/index.svelte';

	import H1 from '../typography/heading/h1.svelte';
	import H3 from '../typography/heading/h3.svelte';
	import { Button } from '../ui/button';
	const i18n = getTranslations();

	const isMobile = new IsMobile();
</script>

<main>
	<section>
		<div class="relative pt-24">
			<div class="mx-auto max-w-7xl px-6">
				<div class="max-w-3xl text-center sm:mx-auto lg:mr-auto lg:mt-0 lg:w-4/5">
					<a
						target="_blank"
						href="https://github.com/urania-dev/snapp/discussions/87"
						class="rounded-(--radius) group mx-auto flex w-fit items-center gap-2 border p-1"
					>
						<span class="rounded-[calc(var(--radius)-0.25rem)] bg-muted px-2 py-1 text-xs"
							><i
								class="ph-duotone ph-chats text-[24px] transition-all group-hover:text-[rebeccapurple]"
							></i></span
						>
						<span class="text-sm">{i18n.t('homepage.feedback')}</span>
						<span class="bg-(--color-border) block h-4 text-center"></span>
						<i class="ph ph-arrow-right text-[20px] px-2"></i>
					</a>

					<H1 class="mx-auto my-8 w-full max-w-xl text-center font-black tracking-wide"
						>{i18n.t('homepage.hero.headline')}</H1
					>

					<H3 class="mx-auto max-w-xl text-center font-medium text-muted-foreground"
						>{i18n.t('homepage.hero.subheadline')}</H3
					>

					<div class="mx-auto mt-8 flex max-w-max gap-4">
						<Button variant="ghost" href="#features">
							<span class="text-nowrap font-medium">{i18n.t('homepage.features.label')}</span>
							<i class="ph ph-arrow-down relative text-[20px]"></i>
						</Button>
						<Button href="#getting-started">
							<span class="text-nowrap font-medium">{i18n.t('homepage.getting-started.label')}</span
							>
							<i class="ph-duotone ph-rocket relative rotate-45 text-[20px]"></i>
						</Button>
					</div>
				</div>
			</div>
			<div class="relative mt-16">
				<div
					class="bg-linear-to-b absolute inset-0 z-10 from-transparent from-35% to-background"
				></div>
				<div class="relative mx-auto max-w-6xl overflow-hidden px-4">
					{#if (page.data.theme === 'dark' || page.data.theme === 'system' )&& isMobile.current === false}
						<img
							class="z-2 relative hidden rounded-2xl border border-border/25 object-contain lg:dark:block"
							src="/screenshot.png"
							alt="app screen dark"
						/>
					{/if}
					{#if page.data.theme === 'light' && isMobile.current === false}
						<img
							class="z-2 relative hidden rounded-2xl border border-border/25 dark:hidden lg:block"
							src="/screenshot-light.png"
							alt="app screen light"
						/>
					{/if}
					{#if (page.data.theme === 'dark' || page.data.theme === 'system' )&& isMobile.current}
						<img
							class="z-2 relative mx-auto hidden rounded-2xl border border-border/25 object-contain dark:block lg:hidden"
							src="/screenshot-mobile.png"
							alt="app mobile dark"
						/>
					{/if}
					{#if page.data.theme === 'light' && isMobile.current}
						<img
							class="z-2 relative mx-auto mb-8 rounded-2xl border border-border/25 lg:hidden"
							src="/screenshot-mobile-light.png"
							alt="app mobile light"
						/>
					{/if}
				</div>
			</div>
		</div>
	</section>
</main>
