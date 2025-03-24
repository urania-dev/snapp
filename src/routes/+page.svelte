<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { PUBLIC_SNAPP_VERSION } from '$env/static/public';
	import I18nButton from '$lib/components/settings/profile/i18nButton.svelte';
	import H1 from '$lib/components/typography/heading/h1.svelte';
	import H2 from '$lib/components/typography/heading/h2.svelte';
	import H3 from '$lib/components/typography/heading/h3.svelte';
	import H4 from '$lib/components/typography/heading/h4.svelte';
	import P from '$lib/components/typography/text/p.svelte';
	import { Button } from '$lib/components/ui/button';
	import { getTranslations } from '$lib/i18n/index.svelte';
	import SvelteSeo from 'svelte-seo';
	import { toast } from 'svelte-sonner';
	const i18n = getTranslations();
	const { data } = $props();

	let secureContext = $derived(browser && navigator.clipboard && page.url.protocol === 'https:');

	const handleCopy = async (command: string) => {
		if (!secureContext) {
			toast.error(i18n.t('tokens.not-allowed-to-copy'));
			return;
		}

		if (navigator.clipboard) await navigator.clipboard.writeText(command);
		toast.info(i18n.t('snapps.helpers.copied-to-clipboard'));
	};
	$effect(()=>{i18n.locale = data.locale })
</script>

<svelte:head>
	{#if env.PUBLIC_UMAMI_WEBSITE_ID && env.PUBLIC_UMAMI_WEBSITE_URL}
		{@html `<script src="${env.PUBLIC_UMAMI_WEBSITE_URL}" data-website-id="${env.PUBLIC_UMAMI_WEBSITE_ID}"></script>`}
	{/if}
</svelte:head>

<div
	class="erratic-bg relative flex h-screen w-screen flex-col overflow-y-scroll scroll-smooth pt-12"
>
	<div
		class="fixed end-0 start-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background/20 px-2 backdrop-blur-sm"
	>
		<Button variant="ghost" href="/" class="h-10 w-10 font-bold uppercase"
			><i class="ph ph-house text-[24px]"></i></Button
		>
		<div class="flex gap-4 pe-2">
			<Button
				href="https://github.com/urania-dev/snapp"
				target="_blank"
				variant="ghost"
				class="h-10 w-10"><i class="ph-duotone ph-github-logo text-[24px]"></i></Button
			>
			<Button
				href="https://hub.docker.com/r/uraniadev/snapp"
				target="_blank"
				variant="ghost"
				class="h-10 w-10"><i class="ph-duotone ph-shipping-container text-[24px]"></i></Button
			>
			<I18nButton availableLanguages={data.availableLanguages} language={data.locale} />
		</div>
	</div>
	<section
		class="flex h-full w-full shrink-0 flex-col items-center justify-center gap-4 text-balance p-4"
	>
		<H1 class="max-w-xl font-black w-full tracking-wide">{i18n.t('homepage.hero.headline')}</H1>
		<H3 class="max-w-xl ">{i18n.t('homepage.hero.subheadline')}</H3>
		<div class="mx-auto my-4 flex w-full max-w-xl gap-4">
			<Button variant="outline" href="#features">
				{i18n.t('homepage.features.label')}
			</Button>
			<Button href="#getting-started">
				{i18n.t('homepage.getting-started.label')}
			</Button>
		</div>
	</section>
	<section
		id="features"
		class="flex h-full w-full shrink-0 flex-col items-center justify-center gap-4 text-balance p-4"
	>
		<div class="mx-auto flex w-full max-w-xl items-center gap-2 px-4">
			<i class="ph-duotone ph-medal text-[24px]"></i>
			<H2 class="w-full p-0 leading-[1]">{i18n.t('homepage.features.label')}</H2>
		</div>
		<div class="flex w-full max-w-xl flex-col justify-center gap-4 md:flex-row">
			<div
				class="flex w-full flex-col gap-2 rounded-sm border bg-foreground/5 p-4 backdrop-blur-sm md:max-w-[28ch]"
			>
				<H4>{i18n.t('homepage.features.why.labels.why')}</H4>
				<P class="!m-0 text-muted-foreground">{i18n.t('homepage.features.why.helpers.why')}</P>
			</div>
			<div
				class="flex w-full flex-col gap-2 rounded-sm border bg-foreground/5 p-4 backdrop-blur-sm md:max-w-[28ch]"
			>
				<H4>{i18n.t('homepage.features.why.labels.ease')}</H4>
				<P class="!m-0 text-muted-foreground">{i18n.t('homepage.features.why.helpers.ease')}</P>
			</div>
		</div>
		<div class="flex w-full max-w-xl flex-col justify-center gap-4 md:flex-row">
			<div
				class="flex w-full flex-col gap-2 rounded-sm border bg-foreground/5 p-4 backdrop-blur-sm md:max-w-[28ch]"
			>
				<H4>{i18n.t('homepage.features.why.labels.secure')}</H4>
				<P class="!m-0 text-muted-foreground">{i18n.t('homepage.features.why.helpers.secure')}</P>
			</div>
			<div
				class="flex w-full flex-col gap-2 rounded-sm border bg-foreground/5 p-4 backdrop-blur-sm md:max-w-[28ch]"
			>
				<H4>{i18n.t('homepage.features.why.labels.analytics')}</H4>
				<P class="!m-0 text-muted-foreground">{i18n.t('homepage.features.why.helpers.analytics')}</P
				>
			</div>
		</div>
		<div class="mx-auto my-4 flex w-full max-w-xl flex-col gap-2 px-2 md:flex-row">
			<Button
				class="order-2 flex items-center gap-2 md:order-1"
				variant="ghost"
				href="#getting-started"
			>
				<i class="ph ph-arrow-down text-[20px]"></i>
				<span>{@html i18n.t('homepage.getting-started.label')}</span>
			</Button>
			<Button
				class="order-1 flex items-center gap-2 md:order-2 "
				variant="ghost"
				href="https://github.com/urania-dev/snapp"
				target="_blank"
			>
				<span>{@html i18n.t('homepage.features.why.full-list')}</span><i
					class="ph ph-arrow-right text-[20px]"
				></i>
			</Button>
		</div>
	</section>
	<section
		id="getting-started"
		class="flex h-full w-full shrink-0 flex-col items-center justify-center gap-2 text-balance p-4"
	>
		<div class="mx-auto mb-2 flex w-full max-w-xl items-center gap-2 px-4">
			<H2 class="w-full p-0 leading-[1]">{i18n.t('homepage.getting-started.claim')}</H2>
		</div>
		<div class="flex w-full max-w-xl flex-col justify-center gap-4 md:flex-row">
			<div
				class="flex w-full max-w-xl flex-col gap-2 rounded-sm border bg-foreground/5 p-4 backdrop-blur-sm"
			>
				<H4>{i18n.t('homepage.getting-started.docker.label')}</H4>

				<div class="flex gap-2">
					{@html data.startDocker}
					<Button
						variant="outline"
						class="h-10 w-10"
						onclick={() => handleCopy('docker run uraniadev/snapp:latest')}
						><i class="ph-duotone ph-copy text-[20px]"></i></Button
					>
				</div>
				<P class="mb-2 text-muted-foreground"
					>{@html i18n.t('homepage.getting-started.docker.helper')}</P
				>
				<div class="flex gap-2">
					{@html data.dockerCompose}
					<Button
						variant="outline"
						class="h-10 w-10"
						onclick={() =>
							handleCopy(
								`services:
	snapp:
		image: uraniadev/snapp:latest
		ports:
		- 3000:3000
			environment:
			ORIGIN: example.org
			PUBLIC_URL: http://example.org
			DATABASE_PROVIDER: sqlite
			DATABASE_URL: file:./db.sqlite
			TOKEN_SECRET: # openssl rand --base64 32
`
							)}><i class="ph-duotone ph-copy text-[20px]"></i></Button
					>
				</div>
			</div>
		</div>
	</section>
	<div
		class="z-30 flex min-h-14 shrink-0 items-center justify-between border-t px-2 bg-background/20 py-4 backdrop-blur-sm"
	>
		<div class="flex flex-col gap-2 w-full justify-start">
			<div class="flex items-center gap-2 w-full justify-start flex-wrap">
				<Button class="p-1 h-8 text-sm" variant="outline" href="https://next.shadcn-svelte.com" target="_blank">ShadCN - Svelte</Button>
				<Button class="p-1 h-8 text-sm" variant="outline" href="https://tailwindcss.com" target="_blank">TailwindCSS</Button>
				<Button class="p-1 h-8 text-sm" variant="outline" href="https://phosphoricons.com" target="_blank">Phosphor Icons</Button>
				<Button class="p-1 h-8 text-sm" variant="outline" href="https://amcharts.com" target="_blank">AM Charts</Button>
				<Button class="p-1 h-8 text-sm" variant="outline" href="https://zenstack.dev" target="_blank">Zenstack</Button>
				<Button class="p-1 h-8 text-sm" variant="outline" href="https://prisma.io" target="_blank">PrismaJS</Button>
				
				
			</div>
			<div class="flex items-center gap-2 w-full justify-start">
				<Button  class="p-1 h-8 text-sm" href="https://opensource.org/license/mit" variant=ghost>
				<i class="ph-duotone ph-copyright text-[20px]"></i>
				<span>{new Date().getFullYear()} urania-dev</span>
				</Button>
				
			</div>			
			<span class="text-foreground-muted px-1 text-xs">{PUBLIC_SNAPP_VERSION}</span>

		</div>
	</div>
	<div
		class="z-30 flex h-14 shrink-0 items-center justify-between border-t bg-background/20 px-2 backdrop-blur-sm"
	>
		<div class="flex items-center gap-2">
			<i class="ph-duotone ph-heart text-[24px]"></i>
			<span class="text-foreground-muted text-sm">made with love &mdash; urania.dev</span>
		</div>

		<div class="flex gap-4 px-2">
			<Button href="/dashboard" variant="ghost" class="h-10 w-10"
				><i class="ph-duotone ph-user-circle-dashed text-[24px]"></i></Button
			>
		</div>
	</div>
</div>

<SvelteSeo title={`${data.appname || 'Snapp'}`} />

<style lang="postcss">
	@keyframes erraticMove {
		0% {
			background-position: 0% 0%;
		}
		20% {
			background-position: 30% 70%;
		}
		40% {
			background-position: 80% 30%;
		}
		60% {
			background-position: 20% 90%;
		}
		80% {
			background-position: 50% 50%;
		}
		100% {
			background-position: 90% 40%;
		}
	}

	.erratic-bg {
		@apply bg-gradient-to-br from-transparent via-[rebeccapurple]/20 to-transparent;
		background-size: 200% 200%;
		animation: erraticMove 20s infinite alternate-reverse;
	}
</style>
