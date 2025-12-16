<script lang="ts">
	import type { AdminLogEntry } from '$lib/server/metrics/helpers';

	import ActivityIcon from '@lucide/svelte/icons/activity';
	import BanIcon from '@lucide/svelte/icons/ban';
	import BugOffIcon from '@lucide/svelte/icons/bug-off';
	import DatabaseIcon from '@lucide/svelte/icons/database';
	import GlobeLockIcon from '@lucide/svelte/icons/globe-lock';
	import KeyRoundIcon from '@lucide/svelte/icons/key-round';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import LinkIcon from '@lucide/svelte/icons/link';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import MousePointerClickIcon from '@lucide/svelte/icons/mouse-pointer-click';
	import RectangleEllipsisIcon from '@lucide/svelte/icons/rectangle-ellipsis';
	import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
	import UserXIcon from '@lucide/svelte/icons/user-round-x';
	// import { browser } from '$app/environment';
	import { env } from '$env/dynamic/public';
	import { columns } from '$lib/components/blocks/activity-log/activity-logs.columns.svelte.js';
	import TableActivityLog from '$lib/components/blocks/activity-log/table-activity-log.svelte';
	import NumberCard from '$lib/components/blocks/commons/number-card.svelte';
	import OrganizationStats from '$lib/components/blocks/urls/organization-stats.svelte';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { fillMissingDaysDivided, formatTimeAgo } from '$lib/utils';
	import { fade } from 'svelte/transition';

	const { data } = $props();

	const total = $derived.by(() => {
		let internal = 0;
		let external = 0;
		data?.kpis?.clicks?.map((a) => {
			internal += a.internal;
			external += a.external;
		});
		return internal + external;
	});

	const metrics = $derived(fillMissingDaysDivided(data.from, data.to, data?.kpis?.clicks || []));
</script>

<svelte:boundary>
	{#snippet pending()}
		<LoaderIcon class="size-5! animate-spin m-auto" />
	{/snippet}
	<div class="flex flex-col w-full h-full divide-y">
		<div class="flex h-14 sticky top-0 bg-background z-50 w-full items-center gap-4 p-4">
			<LayoutDashboardIcon class="size-8! fill-secondary/50" />
			<h1 class="text-2xl font-bold">{m.dashboard()}</h1>
		</div>
		<div class="@container flex w-full grow flex-col @4xl:divide-y">
			<div
				class="flex flex-wrap @4xl:flex-nowrap w-full content-start divide-x divide-y @4xl:divide-y-0 @4xl:order-first"
			>
				<div class="p-4 grow h-max min-w-xs @4xl:min-w-auto w-full">
					<NumberCard
						item={{
							helper: `${formatTimeAgo(data.from, getLocale())}`,
							icon: ActivityIcon,
							label: m.visits(),
							number: total
						}}
					/>
				</div>
				<div class="p-4 grow h-max min-w-xs @4xl:min-w-auto w-full">
					<NumberCard
						item={{
							helper: m.active_urls(),
							icon: MousePointerClickIcon,
							label: m.urls(),
							number: data.kpis.url.active
						}}
					/>
				</div>
				<div class="p-4 grow h-max min-w-xs @4xl:min-w-auto w-full">
					<NumberCard
						item={{
							helper: m.total_urls(),
							icon: LinkIcon,
							label: m.urls(),
							number: data.kpis.url.total
						}}
					/>
				</div>
				<div class="p-4 grow h-max min-w-xs @4xl:min-w-auto w-full">
					<NumberCard
						item={{
							helper: m.blocked_urls(),
							icon: BanIcon,
							label: m.urls(),
							number: data?.security?.urls
						}}
					/>
				</div>
				<div class="p-4 grow h-max min-w-xs @4xl:min-w-auto w-full">
					<NumberCard
						item={{
							helper: m.valid_now(),
							icon: KeyRoundIcon,
							label: m.api_keys(),
							number: data?.security?.apikeys
						}}
					/>
				</div>
			</div>
			<div
				class="grid grid-cols-1 divide-y @4xl:divide-x @4xl:divide-y-0 @4xl:grid-cols-7 h-full order-first @4xl:order-last"
			>
				<div class="col-span-4 flex flex-col items-center justify-center border-t @4xl:border-t-0">
					<div in:fade|global class="w-full flex flex-col h-full">
						<TableActivityLog
							showCreate={false}
							showDelete={false}
							selected={null}
							limit={data.limit}
							data={(data.user.role === 'admin'
								? (data?.activityLog as AdminLogEntry[])
								: (data?.activityLog?.map((l) => ({
										...l,
										actor: { id: data.user.id, username: data.user.username }
									})) as AdminLogEntry[])) || []}
							{columns}
						/>
					</div>
				</div>
				<div
					class={[
						'p-4 flex col-span-3 h-full flex-col order-first @4xl:order-last min-h-[calc(25dvh+122px)]!',
						data.user?.role !== 'user' ? 'h-[calc(25dvh+122px)]' : 'h-full'
					]}
				>
					<OrganizationStats chartClass="h-full aspect-auto!" {metrics} />
				</div>
			</div>
		</div>
		{#if data.user?.role !== 'user'}
			<div class="flex flex-col divide-y w-full @container/admin">
				<div class="h-14 p-4 w-full order-first! flex items-center gap-2">
					<ShieldCheckIcon class="size-5! text-success" />
					<h4 class="font-semibold pb-0.5">{m.security_summary()}</h4>
				</div>
				<div
					class="flex @6xl:flex-nowrap flex-wrap order-first @4xl:order-last divide-y w-full h-full"
				>
					<div
						class="grid grid-cols-2 divide-x @4xl:divide-y-0 divide-y @4xl/admin:grid-cols-3 w-full"
					>
						<div class="p-4 w-full flex border-b-0">
							<NumberCard
								item={{
									helper: `${m.username()}`,
									icon: RectangleEllipsisIcon,
									label: m.total_banned_usernames(),
									number: data?.security?.users.username
								}}
							/>
						</div>

						<div
							class="p-4 w-full flex col-span-2 @4xl/admin:col-span-1 @4xl:border-s @4xl:order-2 order-first"
						>
							<NumberCard
								item={{
									helper: `${m.users()}`,
									icon: UserXIcon,
									label: m.total_banned_users(),
									number: data?.security?.users?.banned
								}}
							/>
						</div>
						<div class="p-4 w-full flex">
							<NumberCard
								item={{
									helper: `${m.domains()}`,
									icon: BugOffIcon,
									label: m.total_banned_domains(),
									number: data?.security?.domains?.blacklisted
								}}
							/>
						</div>
					</div>
					<div
						class="grid grid-cols-1 @4xl/admin:divide-x @4xl/admin:divide-y-0 divide-y @4xl/admin:grid-cols-3 w-full"
					>
						<div class="p-4 w-full flex">
							<NumberCard
								item={{
									helper: `${m.domains()}`,
									icon: GlobeLockIcon,
									label: m.whitelisted(),
									number: data?.security?.domains?.whitelisted
								}}
							/>
						</div>
						<div class="p-4 w-full flex">
							<NumberCard
								item={{
									helper: m.vt_cache_helper(),
									icon: DatabaseIcon,
									label: m.vt_cache_entries(),
									number: data?.security?.domains?.vtapi
								}}
							/>
						</div>
						<div class="p-4 w-full flex">
							<NumberCard
								item={{
									helper: m.stats_app_version(),
									label: data.appname,
									number: env.PUBLIC_VERSION
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</svelte:boundary>
