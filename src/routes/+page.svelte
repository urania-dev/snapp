<script>
	import Card from '$lib/ui/card.svelte';
	import Icon from '$lib/ui/icon.svelte';
	import logo from '$lib/utils/logo.svg?raw';
	import { _ } from 'svelte-i18n';
	import { fly } from 'svelte/transition';

	let { data } = $props();
</script>

<svelte:head>
	{#if data.UMAMI_WEBSITE_ID}
		<script
			async
			src="{data.UMAMI_WEBSITE_URL}/script.js"
			data-website-id={data.UMAMI_WEBSITE_ID}
		></script>
	{/if}
</svelte:head>

<div class="flex w-full flex-col p-4 pb-8">
	<div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-4">
		<div class="flex justify-between items-center">
			<h2 class="flex items-center gap-2 text-2xl font-bold">
				<div class="h-12 w-12">
					{@html logo}
				</div>
				<span>{@html $_('appname')}</span>
			</h2>
			<div class="flex gap-4 items-center h-10 font-medium">
				<Card css={{ card: 'flex-row p-2' }}>
					<a
						href="https://github.com/urania-dev/snapp"
						target="_blank"
						class="group flex items-center gap-2"
					>
						<Icon ph="github-logo"></Icon>
						<small class="pt-0.5 transition-all group-hover:text-pink-500">Github</small>
					</a>
				</Card>
				<Card css={{ card: 'flex-row p-2' }}>
					<a
						href="https://hub.docker.com/r/uraniadev/snapp"
						target="_blank"
						class=" group flex items-center gap-2"
					>
						<Icon ph="shipping-container"></Icon>
						<small class="pt-0.5 transition-all group-hover:text-pink-600 whitespace-nowrap"
							>Docker Hub</small
						>
					</a>
				</Card>
			</div>
		</div>
		<div class="flex w-full flex-col h-full gap-4">
			<Card css={{ card: 'gap-4 h-full' }}>
				<p class="text-balance leading-relaxed">{@html $_('homepage.intro')}</p>
			</Card>
			<Card css={{ card: 'gap-4 h-full' }}>
				<div class="flex w-full gap-4">
					<Icon ph="medal"></Icon>
					<h3 class="text-balance font-semibold tracking-wide leading-relaxed">
						{$_('homepage.features.label')}
					</h3>
				</div>
				<div class="flex flex-col lg:flex-row gap-4 w-full h-full">
					<div class="flex w-full h-full" in:fly|global={{ y: 25, duration: 125 * 1 }}>
						<Card css={{ card: 'items-start h-full' }}>
							<h4 class="font-semibold">{@html $_('homepage.features.ui.label')}</h4>
							<small class="text-sm text-balance tracking-wide leading-relaxed"
								>{@html $_('homepage.features.ui.description')}</small
							>
						</Card>
					</div>
					<div class="flex w-full h-full" in:fly|global={{ y: 25, duration: 125 * 2 }}>
						<Card css={{ card: 'items-start h-full' }}>
							<h4 class="font-semibold">{@html $_('homepage.features.auth.label')}</h4>
							<small class="text-sm text-balance tracking-wide leading-relaxed"
								>{@html $_('homepage.features.auth.description')}</small
							>
						</Card>
					</div>
					<div class="flex w-full h-full" in:fly|global={{ y: 25, duration: 125 * 3 }}>
						<Card css={{ card: 'items-start h-full' }}>
							<h4 class="font-semibold">{@html $_('homepage.features.shortcode.label')}</h4>
							<small class="text-sm text-balance tracking-wide leading-relaxed"
								>{@html $_('homepage.features.shortcode.description')}</small
							>
						</Card>
					</div>
				</div>
				<div class="flex flex-col lg:flex-row gap-4 w-full h-full">
					<div class="flex w-full h-full" in:fly|global={{ y: 25, duration: 125 * 4 }}>
						<Card css={{ card: 'items-start h-full' }}>
							<h4 class="font-semibold">{@html $_('homepage.features.expiration.label')}</h4>
							<small class="text-sm text-balance tracking-wide leading-relaxed"
								>{@html $_('homepage.features.expiration.description')}</small
							>
						</Card>
					</div>
					<div class="flex w-full h-full" in:fly|global={{ y: 25, duration: 125 * 5 }}>
						<Card css={{ card: 'items-start h-full' }}>
							<h4 class="font-semibold">{@html $_('homepage.features.secrecy.label')}</h4>
							<small class="text-sm text-balance tracking-wide leading-relaxed"
								>{@html $_('homepage.features.secrecy.description')}</small
							>
						</Card>
					</div>
					<div class="flex w-full h-full" in:fly|global={{ y: 25, duration: 125 * 6 }}>
						<Card css={{ card: 'items-start h-full' }}>
							<h4 class="font-semibold">{@html $_('homepage.features.analytics.label')}</h4>
							<small class="text-sm text-balance tracking-wide leading-relaxed"
								>{@html $_('homepage.features.analytics.description')}</small
							>
						</Card>
					</div>
				</div>
				<div class="flex flex-col lg:flex-row gap-4 w-full h-full">
					<div class="flex w-full h-full" in:fly|global={{ y: 25, duration: 125 * 7 }}>
						<Card css={{ card: 'items-start h-full' }}>
							<h4 class="font-semibold">{@html $_('homepage.features.umami.label')}</h4>
							<small class="text-sm text-balance tracking-wide leading-relaxed"
								>{@html $_('homepage.features.umami.description', {
									values: { url: 'https://umami.is' }
								})}</small
							>
						</Card>
					</div>
					<div class="flex w-full h-full" in:fly|global={{ y: 25, duration: 125 * 8 }}>
						<Card css={{ card: 'items-start h-full' }}>
							<h4 class="font-semibold">{@html $_('homepage.features.vtapi.label')}</h4>
							<small class="text-sm text-balance tracking-wide leading-relaxed"
								>{@html $_('homepage.features.vtapi.description', {
									values: { url: 'https://www.virustotal.com/gui/' }
								})}</small
							>
						</Card>
					</div>
					<div class="flex w-full h-full" in:fly|global={{ y: 25, duration: 125 * 9 }}>
						<Card css={{ card: 'items-start h-full' }}>
							<h4 class="font-semibold">
								{@html $_('homepage.features.rest-api.label', { values: { url: '/docs' } })}
							</h4>
							<small class="text-sm text-balance tracking-wide leading-relaxed"
								>{@html $_('homepage.features.rest-api.description', {
									values: { url: '/docs' }
								})}</small
							>
						</Card>
					</div>
				</div>
			</Card>
			<div class="flex flex-col lg:flex-row gap-4">
				<Card>
					<div class="flex w-full leading-none items-center gap-4">
						<Icon ph="rocket"></Icon>
						<p class="text-balance font-semibold tracking-wide leading-relaxed">
							{$_('homepage.getting-started.label')}
						</p>
					</div>
					<p class="text-balance my-2 w-full text-sm tracking-wide leading-relaxed">
						{$_('homepage.getting-started.claim')}
					</p>

					<div class="flex w-full leading-none items-center gap-2">
						<Icon ph="shipping-container"></Icon>
						<small class="text-sm font-semibold tracking-wide pt-0.5"
							>{$_('homepage.getting-started.docker.label')}</small
						>
					</div>
					<small class="text-sm tracking-wide mb-2 w-full"
						>{$_('homepage.getting-started.docker.helper')}</small
					>
					{@html data.code}
				</Card>
				<div class="flex flex-col gap-4 w-full">
					<Card>
						<div class="flex w-full leading-none items-center gap-4">
							<Icon ph="computer-tower"></Icon>
							<p class="text-balance font-semibold tracking-wide leading-relaxed">
								{$_('homepage.migration.label')}
							</p>
						</div>
						<p class="text-balance my-2 text-sm w-full tracking-wide leading-relaxed">
							{@html $_('homepage.migration.description')}
						</p>
					</Card>
					<Card css={{ card: 'h-full' }}>
						<div class="flex w-full h-full leading-none items-center gap-4">
							<Icon ph="stack"></Icon>
							<p class="text-balance font-semibold pt-0.5 tracking-wide leading-relaxed">
								{$_('homepage.stack.label')}
							</p>
						</div>
						<p class="text-balance text-sm my-2 w-full tracking-wide leading-relaxed">
							{@html $_('homepage.stack.helper')}
						</p>
						<div class="flex gap-4 h-full flex-wrap text-sm font-medium tracking-wide w-full">
							<a href="https://kit.svelte.dev/" class="flex h-10 hover:text-pink-500"
								><Card css={{ card: 'p-2 flex-row max-w-max pe-4 items-center' }}
									><img src="sveltekit.svg" alt="sveltekit-logo" width="24" />
									<span>SvelteKit</span></Card
								></a
							>
							<a href="https://www.typescriptlang.org/" class="flex h-10 hover:text-pink-500"
								><Card css={{ card: 'p-2 flex-row max-w-max pe-4 items-center' }}
									><img src="typescript.svg" alt="typescript-logo" width="24" />
									<span>Typescript</span></Card
								></a
							>
							<a href="https://www.prisma.io/" class="flex h-10 hover:text-pink-500"
								><Card css={{ card: 'p-2 flex-row max-w-max pe-4 items-center' }}
									><img
										src="prisma.svg"
										class="dark:invert dark:-hue-rotate-180"
										alt="prisma-logo"
										width="16"
									/>
									<span>Prisma</span></Card
								></a
							>
							<a href="https://lucia-auth.com/" class="flex h-10 hover:text-pink-500"
								><Card css={{ card: 'p-2 flex-row max-w-max pe-4 items-center' }}
									><Icon ph="shield-star" css={{ icon: 'text-amber-500' }}></Icon>
									<span>Lucia Auth</span></Card
								></a
							>
							<a href="https://www.tailwindcss.com/" class="flex h-10 hover:text-pink-500"
								><Card css={{ card: 'p-2 flex-row max-w-max pe-4 items-center' }}
									><img
										src="tailwind.svg"
										class="dark:invert dark:-hue-rotate-180"
										alt="tailwind-logo"
										width="24"
									/>
									<span>TailwindCSS</span></Card
								></a
							>
							<a href="https://www.amcharts.com/" class="flex h-10 hover:text-pink-500"
								><Card css={{ card: 'p-2 flex-row max-w-max pe-4 items-center' }}
									><img
										src="amcharts.png"
										class="dark:invert dark:-hue-rotate-180"
										alt="amcharts-logo"
										width="32"
									/>
									<span>amCharts</span></Card
								></a
							>
							<a href="https://www.maxmind.com/" class="flex h-10 hover:text-pink-500"
								><Card css={{ card: 'p-2 flex-row max-w-max pe-4 items-center' }}
									><img
										src="maxmind.svg"
										class="dark:invert dark:-hue-rotate-180"
										alt="maxmind-logo"
										width="32"
									/>
									<span>MaxMind</span></Card
								></a
							>
							<a href="https://phosphoricons.com/" class="flex h-10 hover:text-pink-500"
								><Card css={{ card: 'p-2 flex-row max-w-max pe-4 items-center' }}
									><Icon ph="phosphor-logo"></Icon> <span>Phosphor Icons</span></Card
								></a
							>
						</div>
					</Card>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(pre) {
		padding: 1rem;
		border-radius: theme('borderRadius.sm');
		line-height: theme('lineHeight.relaxed');
		margin: 0;
		width: 100%;
		height: 100%;
		transition: all 0.25s ease-in;
	}
</style>
