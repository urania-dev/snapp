<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import Features from '$lib/components/homepage/features.svelte';
	import Hero from '$lib/components/homepage/hero.svelte';
	import I18nButton from '$lib/components/settings/profile/i18nButton.svelte';
	import ThemeForHomepage from '$lib/components/settings/profile/themeForHomepage.svelte';
	import H2 from '$lib/components/typography/heading/h2.svelte';
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
	$effect(() => {
		i18n.locale = data.locale;
	});
</script>

<div
	class="erratic-bg relative flex h-screen w-screen flex-col overflow-y-scroll scroll-smooth pt-12"
>
	<div
		class="fixed end-0 start-0 top-0 z-30 flex h-14 items-center justify-between border-b bg-background/20 px-2 backdrop-blur-sm"
	>
		<div class="flex min-w-[110px]">
			<Button variant="ghost" href="/" class="h-10 w-10 font-bold uppercase"
				><i class="ph ph-house text-[24px]"></i></Button
			>
		</div>
		<div class="flex gap-4">
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
		</div>
		<div class="flex gap-4 pe-2">
			<ThemeForHomepage theme={data.theme} />
			<I18nButton availableLanguages={data.availableLanguages} language={data.locale} />
		</div>
	</div>
	<section class="flex flex-col items-center justify-center gap-4 text-balance p-4">
		<Hero />
	</section>
	<section
		id="features"
		class="flex w-full flex-col items-center justify-center gap-4 text-balance p-4 md:min-h-full"
	>
		<Features
			--grid-border="270 100% 70%"
			features={[
				{
					icon: 'medal',
					label: 'homepage.features.why.labels.ease',
					text: 'homepage.features.why.helpers.ease'
				},
				{
					icon: 'lock-laminated',
					label: 'homepage.features.why.labels.secure',
					text: 'homepage.features.why.helpers.secure'
				},
				{
					icon: 'chart-line',
					label: 'homepage.features.why.labels.analytics',
					text: 'homepage.features.why.helpers.analytics'
				}
			]}
		/>
		<div
			class="mx-auto my-4 flex w-full max-w-xl flex-col items-center justify-center gap-3 px-2 md:flex-row"
		>
			<Button
				class="order-2 flex items-center gap-2 md:order-1"
				variant="ghost"
				href="#getting-started"
			>
				<i class="ph ph-arrow-down text-[20px]"></i>
				<span>{@html i18n.t('homepage.getting-started.label')}</span>
			</Button>
			<Button
				class="order-1 flex w-max items-center gap-2 md:order-2 "
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
		class="flex flex-col items-center justify-center gap-2 text-balance p-4 sm:min-h-full"
	>
		<div class="mx-auto mb-2 flex w-full max-w-xl items-center gap-2 px-4">
			<H2 class="w-full p-0 text-center">{i18n.t('homepage.getting-started.claim')}</H2>
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
		class="z-30 flex min-h-14 shrink-0 items-center justify-between border-t bg-background/20 px-2 py-4 backdrop-blur-sm"
	>
		<div class="flex w-full flex-col justify-start gap-2">
			<div class="flex w-full flex-wrap items-center justify-start gap-2">
				<Button
					class="h-8 p-1 text-sm"
					variant="outline"
					href="https://next.shadcn-svelte.com"
					target="_blank">ShadCN - Svelte</Button
				>
				<Button
					class="h-8 p-1 text-sm"
					variant="outline"
					href="https://tailwindcss.com"
					target="_blank">TailwindCSS</Button
				>
				<Button
					class="h-8 p-1 text-sm"
					variant="outline"
					href="https://phosphoricons.com"
					target="_blank">Phosphor Icons</Button
				>
				<Button
					class="h-8 p-1 text-sm"
					variant="outline"
					href="https://amcharts.com"
					target="_blank">AM Charts</Button
				>
				<Button
					class="h-8 p-1 text-sm"
					variant="outline"
					href="https://zenstack.dev"
					target="_blank">Zenstack</Button
				>
				<Button class="h-8 p-1 text-sm" variant="outline" href="https://prisma.io" target="_blank"
					>PrismaJS</Button
				>
			</div>
			<div class="flex w-full items-center justify-start gap-2">
				<Button class="h-8 p-1 text-sm" href="https://opensource.org/license/mit" variant="ghost">
					<i class="ph-duotone ph-copyright text-[20px]"></i>
					<span>{new Date().getFullYear()} urania-dev</span>
				</Button>
			</div>
			<span class="text-foreground-muted px-1 text-xs">{env.PUBLIC_SNAPP_VERSION}</span>
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
