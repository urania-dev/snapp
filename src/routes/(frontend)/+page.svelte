<script>
	import { getLocale } from '$lib/i18n';
	import { H1, Lead, Paragraph, Small, Ul } from '$lib/ui/typography';

	import Logo from '$lib/logo/logo.svg?raw';
	import SkeletonLogo from '$lib/logo/skeleton.svg?raw';
	import MaxMindLogo from '$lib/logo/maxmind.svg?raw';
	import SvelteKitLogo from '$lib/logo/sveltekit.svg?raw';
	import LucideIcon from '$lib/logo/lucide.svg?raw';
	import AuthJSLogo from '$lib/logo/authjs.svg?raw';
	import RedisLogo from '$lib/logo/redis.svg?raw';

	import StackIcon from 'lucide-svelte/icons/layers';
	import FeaturesIcon from 'lucide-svelte/icons/award';
	import CloneIcon from 'lucide-svelte/icons/copy-check';
	import ContainerIcon from 'lucide-svelte/icons/container';
	import CorsIcon from 'lucide-svelte/icons/shield-alert';
	import DownloadIcon from 'lucide-svelte/icons/hard-drive-download';
	import DevIcon from 'lucide-svelte/icons/keyboard';
	import BuildIcon from 'lucide-svelte/icons/server-cog';
	import RunIcon from 'lucide-svelte/icons/router';
	import RocketIcon from 'lucide-svelte/icons/rocket';
	import KeyIcon from 'lucide-svelte/icons/key';
	import NodeJSIcon from 'lucide-svelte/icons/hexagon';
	import DBIcon from 'lucide-svelte/icons/database';
	import { CodeBlock } from '@skeletonlabs/skeleton';
	const { t } = getLocale();
	const APPNAME = $t('global:appname');
</script>

<svelte:head><title>{$t('global:appname')}</title></svelte:head>

<div class="page my-8 p-4">
	<H1 class="flex items-end gap-2">
		<div class="logo grid h-10 w-10 items-end justify-center">
			{@html Logo}
		</div>
		{APPNAME}
	</H1>
	<Paragraph class="text-base max-w-xl ps-2">{$t('home:intro', { appname: APPNAME })}</Paragraph>

	<div class="flex gap-4 w-full items-center mt-4">
		<hr class="w-full" />
		<FeaturesIcon class="w-4 h-4 flex-shrink-0" /><Lead class="min-w-max"
			>{$t('home:features:label')}</Lead
		>
		<hr class="w-full" />
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 justify-center gap-4">
		<div class="card">
			<div class="card-header">
				<Lead>{$t('home:features:ui:label')}</Lead>
			</div>
			<div class="card-body p-4">
				<Paragraph>{$t('home:features:ui:description')}</Paragraph>
			</div>
		</div>
		<div class="card">
			<div class="card-header">
				<Lead>{$t('home:features:auth:label')}</Lead>
			</div>
			<div class="card-body p-4">
				<Paragraph>{$t('home:features:auth:description')}</Paragraph>
			</div>
		</div>
		<div class="card">
			<div class="card-header">
				<Lead>{$t('home:features:shortcode:label')}</Lead>
			</div>
			<div class="card-body p-4">
				<Paragraph>{$t('home:features:shortcode:description')}</Paragraph>
			</div>
		</div>
		<div class="card">
			<div class="card-header">
				<Lead>{$t('home:features:ttl:label')}</Lead>
			</div>
			<div class="card-body p-4">
				<Paragraph>{$t('home:features:ttl:description')}</Paragraph>
			</div>
		</div>
		<div class="card">
			<div class="card-header">
				<Lead>{$t('home:features:secret:label')}</Lead>
			</div>
			<div class="card-body p-4">
				<Paragraph>{$t('home:features:secret:description')}</Paragraph>
			</div>
		</div>
		<div class="card">
			<div class="card-header">
				<Lead>{$t('home:features:metrics:label')}</Lead>
			</div>
			<div class="card-body p-4">
				<Paragraph>{$t('home:features:metrics:description')}</Paragraph>
			</div>
		</div>
		<div class="card">
			<div class="card-header">
				<Lead>{$t('home:features:integration:label')}</Lead>
			</div>
			<div class="card-body p-4">
				<Paragraph>{@html $t('home:features:integration:description')}</Paragraph>
			</div>
		</div>
		<div class="card">
			<div class="card-header">
				<Lead>{$t('home:features:vt:label')}</Lead>
			</div>
			<div class="card-body p-4">
				<Paragraph>{@html $t('home:features:vt:description')}</Paragraph>
			</div>
		</div>
		<div class="card">
			<div class="card-header">
				<Lead>{$t('home:features:rest:label')}</Lead>
			</div>
			<div class="card-body p-4">
				<Paragraph>{@html $t('home:features:rest:description')}</Paragraph>
			</div>
		</div>
	</div>
	<div class="flex gap-4 w-full items-center my-4">
		<hr class="w-full" />
		<RocketIcon class="flex-shrink-0 w-4 h-4" /><Lead class="min-w-max"
			>{$t('home:getting:started:label')}</Lead
		>
		<Paragraph class="whitespace-nowrap">{$t('home:getting:started:description')}</Paragraph>
		<hr class="w-full" />
	</div>

	<div class="grid lg:grid-cols-2 gap-4">
		<div class="card">
			<div class="card-header">
				<Lead>{@html $t('home:manual:install')}</Lead>
			</div>
			<div class="card-body p-4 gap-2 flex flex-col">
				<Paragraph class="flex gap-4 max-w-sm mt-[0!important]">
					<div class="badge variant-glass-warning w-8 h-8">
						<NodeJSIcon class="w-5 h-5 flex-shrink-0" />
					</div>
					{@html $t('home:manual:install:steps')}
				</Paragraph>
				<Paragraph class="flex gap-4 max-w-sm">
					<div class="badge variant-glass-warning w-8 h-8">
						<DBIcon class="w-4 h-4 flex-shrink-0" />
					</div>
					{@html $t('home:manual:install:redis')}
				</Paragraph>
				<Paragraph class="flex gap-4">
					<div class="badge variant-glass-warning w-8 h-8">
						<CloneIcon strokeWidth="2.25" class="w-4 h-4 flex-shrink-0" />
					</div>
					<span>
						{@html $t('home:manual:install:clone:0')}
						{@html $t('home:manual:install:clone:1')}
					</span>
				</Paragraph>
				<Paragraph class="flex gap-4">
					<div class="badge variant-glass-warning w-8 h-8">
						<DownloadIcon class="w-4 h-4 flex-shrink-0" />
					</div>
					<span>
						{@html $t('home:manual:install:download:0')}<br />
						{@html $t('home:manual:install:download:1')}
					</span>
				</Paragraph>
				<Paragraph class="flex gap-4">
					<div class="badge variant-glass-warning w-8 h-8">
						<KeyIcon class="w-4 h-4 flex-shrink-0" />
					</div>
					<span>
						{@html $t('home:manual:install:env:0')}
						{@html $t('home:manual:install:env:1')}
					</span>
				</Paragraph>
				<Paragraph class="flex gap-4">
					<div class="badge variant-glass-warning w-8 h-8">
						<DevIcon class="w-4 h-4 flex-shrink-0" />
					</div>

					<span>
						{@html $t('home:manual:install:dev:0')}<br />
						{@html $t('home:manual:install:dev:1')}
					</span>
				</Paragraph>
				<Paragraph class="flex gap-4">
					<div class="badge variant-glass-warning w-8 h-8">
						<BuildIcon class="w-4 h-4 flex-shrink-0" />
					</div>
					<span>
						{@html $t('home:manual:install:build:0')}<br />
						{@html $t('home:manual:install:build:1')}
					</span>
				</Paragraph>
				<Paragraph class="flex gap-4 mb-4">
					<div class="badge variant-glass-warning w-8 h-8">
						<RunIcon class="w-4 h-4 flex-shrink-0" />
					</div>
					<span>
						{@html $t('home:manual:install:run:0')}<br />
						{@html $t('home:manual:install:run:1')}
					</span>
				</Paragraph>
			</div>
		</div>
		<div class="flex flex-col gap-4">
			<div class="card">
				<div class="card-header">
					<Lead>{@html $t('home:docker')}</Lead>
				</div>
				<div class="card-body p-4 gap-2 flex flex-col">
					<Paragraph class="flex gap-4 mb-4">
						<div class="badge variant-glass-warning w-8 h-8">
							<ContainerIcon class="w-4 h-4 flex-shrink-0" />
						</div>

						<div class="flex flex-col gap-2 w-full">
							{$t('home:docker:description')}
							<CodeBlock
								buttonLabel={$t('global:misc:copy')}
								language="shell"
								code={$t('home:docker:run')}
							></CodeBlock>
						</div>
					</Paragraph>
					<Paragraph class="flex gap-4 mb-4">
						<div class="badge variant-glass-warning w-8 h-8">
							<CorsIcon class="w-4 h-4 flex-shrink-0" />
						</div>

						<div class="flex flex-col gap-2 w-full">
							<span class="max-w-sm">
								{@html $t('home:docker:run:cors')}
							</span>
							<CodeBlock
								buttonLabel={$t('global:misc:copy')}
								language="shell"
								code={$t('home:docker:run:origin')}
							></CodeBlock>
						</div>
					</Paragraph>
				</div>
			</div>
			<div class="card h-full">
				<div class="card-header">
					<Lead>{$t('home:migration')}</Lead>
				</div>
				<div class="card-body p-4 gap-2 flex flex-col">
					<Paragraph>
						{$t('home:migration:description')}
					</Paragraph>
				</div>
			</div>
		</div>
	</div>
	<div class="flex gap-4 w-full items-center my-4">
		<hr class="w-full" />
		<StackIcon class="w-4 h-4 flex-shrink-0" /><Lead class="min-w-max"
			>{$t('home:stack:label')}</Lead
		>
		<Paragraph class="whitespace-nowrap">{$t('home:stack:description')}</Paragraph>
		<hr class="w-full" />
	</div>

	<div class="flex flex-wrap gap-4 justify-center">
		<div class="card min-w-60 sm:max-w-60 w-full">
			<a href="https://kit.svelte.dev/docs/introduction">
				<div class="card-body gap-2 p-4 justify-center flex items-center">
					<div class="w-12 h-12 flex-shrink-0">
						{@html SvelteKitLogo}
					</div>
					<Lead class="me-4">Svelte Kit</Lead>
				</div>
			</a>
		</div>
		<div class="card min-w-60 sm:max-w-60 w-full">
			<a href="https://redis.io/">
				<div class="card-body gap-2 p-4 justify-center flex items-center">
					<div class="w-12 h-12 flex-shrink-0">
						{@html RedisLogo}
					</div>
					<Lead class="me-4">Redis</Lead>
				</div>
			</a>
		</div>
		<div class="card min-w-60 sm:max-w-60 w-full">
			<a href="https://authjs.dev/">
				<div class="card-body gap-2 p-4 justify-center flex items-center">
					<div class="w-12 h-12 flex-shrink-0">
						{@html AuthJSLogo}
					</div>
					<Lead class="me-4">Auth.js</Lead>
				</div>
			</a>
		</div>
		<div class="card min-w-60 sm:max-w-60 w-full">
			<a href="https://www.skeleton.dev/">
				<div class="card-body gap-2 p-4 justify-center flex items-center">
					<div class="w-12 h-12 flex-shrink-0">
						{@html SkeletonLogo}
					</div>
					<Lead class="me-4">Skeleton</Lead>
				</div>
			</a>
		</div>
		<div class="card min-w-60 sm:max-w-60 w-full">
			<a href="https://dev.maxmind.com/geoip/geolite2-free-geolocation-data">
				<div class="card-body gap-2 p-4 justify-center flex items-center">
					<div class="w-12 h-12 flex-shrink-0">
						{@html MaxMindLogo}
					</div>
					<Lead class="me-4">MaxMind</Lead>
				</div>
			</a>
		</div>
		<div class="card min-w-60 sm:max-w-60 w-full">
			<a href="https://lucide.dev">
				<div class="card-body gap-2 p-4 justify-center flex items-center">
					<div class="w-12 h-12 flex-shrink-0">
						{@html LucideIcon}
					</div>
					<Lead class="me-4">Lucide</Lead>
				</div>
			</a>
		</div>
	</div>
</div>

<style lang="postcss">
	:global(.logo > svg) {
		width: 100%;
		height: 100%;
	}

	:global(.code) {
		@apply whitespace-normal md:whitespace-nowrap;
	}
</style>
