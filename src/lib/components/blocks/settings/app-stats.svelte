<script lang="ts">
	import ActivityIcon from '@lucide/svelte/icons/activity';
	import BookUpIcon from '@lucide/svelte/icons/book-up';
	import ComputerIcon from '@lucide/svelte/icons/computer';
	import ContainerIcon from '@lucide/svelte/icons/container';
	import CPUIcon from '@lucide/svelte/icons/cpu';
	import GithubIcon from '@lucide/svelte/icons/github';
	import HardDriveIcon from '@lucide/svelte/icons/hard-drive';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import MemoryStickIcon from '@lucide/svelte/icons/memory-stick';
	import PackageIcon from '@lucide/svelte/icons/package';
	import PuzzleIcon from '@lucide/svelte/icons/puzzle';
	import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
	import ShellIcon from '@lucide/svelte/icons/shell';
	import { invalidateAll } from '$app/navigation';
	import { env } from '$env/dynamic/public';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Item from '$lib/components/ui/item';
	import { m } from '$lib/paraglide/messages';
	import { displaySize } from '$lib/utils';
	type ServerInfo = {
		appname: string;
		arch: NodeJS.Architecture;
		containerId: string;
		cpus: number;
		hostname: string;
		memory: {
			total: number;
		};
		platform: NodeJS.Platform;
		runtime: string;
		srv_uptime: {
			hours: number;
			minutes: number;
			seconds: number;
		};
		uptime: {
			hours: number;
			minutes: number;
			seconds: number;
		};
	};
	let { info }: { info?: ServerInfo } = $props();
</script>

<div class="w-full @container">
	<svelte:boundary>
		{#snippet pending()}
			<div class="@md:h-[258px]! h-[500px] w-full flex bg-muted/50">
				<LoaderIcon class=" m-auto animate-spin" />
			</div>
		{/snippet}
		<Item.Root class="p-0 @2xl:order-0 @2xl:p-0!">
			<Item.ItemGroup class="w-full gap-0 overflow-clip">
				<Item.Root variant="muted" class="min-h-[54px] w-full grow items-center rounded-b-none p-2">
					<Item.Media variant="icon">
						<PuzzleIcon class="fill-current/50" />
					</Item.Media>
					<Item.Content>
						<Item.Title class="text-lg font-bold">{m.stats_app_label()}</Item.Title>
					</Item.Content>
					<Item.Actions>
						<Button
							variant="ghost"
							size="icon"
							class="self-start"
							onclick={async () => {
								await invalidateAll();
							}}
						>
							<RefreshCcwIcon />
						</Button>
					</Item.Actions>
				</Item.Root>
				<Item.Root class="overflow-clip rounded-t-none p-0!" variant="muted">
					<Item.Content class="flex w-full justify-start gap-0! overflow-clip p-0">
						<div
							class="grid grid-cols-1 gap-0 divide-y border-t @md:grid-cols-3 @md:divide-x @md:divide-y-0"
						>
							<div class="flex items-center p-2">
								<div class="flex w-full items-center gap-2">
									<BookUpIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">{m.stats_app_version()}</span>
								</div>
								<div class="flex w-full justify-end">
									<Badge variant="ghost">
										{env.PUBLIC_VERSION}
									</Badge>
								</div>
							</div>
							<div class="flex items-center p-2">
								<div class="flex w-full items-center gap-2">
									<CPUIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">{m.stats_app_srv_cpus()}</span>
								</div>
								<div class="flex w-full justify-end">
									<Badge variant="ghost">
										{info?.cpus}
									</Badge>
								</div>
							</div>
							<div class="flex items-center p-2">
								<div class="flex w-full items-center gap-2">
									<MemoryStickIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">{m.stats_app_srv_memory()}</span>
								</div>
								<div class="flex w-full justify-end">
									<Badge variant="ghost">
										{displaySize(info?.memory.total || 0)}
									</Badge>
								</div>
							</div>
						</div>
						<div
							class="grid grid-cols-1 divide-y border-t @md:grid-cols-2 @md:divide-x @md:divide-y-0"
						>
							<div class="flex items-center p-2">
								<div class="flex w-full items-center gap-2">
									<ShellIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">{m.stats_app_srv_arch()}</span>
								</div>
								<div class="flex w-full justify-end">
									<Badge variant="ghost">
										{info?.arch} | {info?.platform}
									</Badge>
								</div>
							</div>
							<div class="flex items-center p-2">
								<div class="flex w-full items-center gap-2">
									<HardDriveIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">{m.stats_app_srv_hostname()}</span>
								</div>
								<div class="flex w-full justify-end">
									<Badge variant="ghost">
										{info?.hostname}
									</Badge>
								</div>
							</div>
						</div>
						<div
							class="grid grid-cols-1 divide-y border-t @md:grid-cols-2 @md:divide-x @md:divide-y-0"
						>
							<div class="flex items-center p-2">
								<div class="flex w-full items-center gap-2">
									<PackageIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">{m.stats_app_srv_runtime()}</span>
								</div>
								<div class="flex w-full justify-end">
									<Badge variant="ghost">
										{info?.runtime}
									</Badge>
								</div>
							</div>
							<div class="flex items-center p-2">
								<div class="flex w-full items-center gap-2">
									<ContainerIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">{m.stats_app_srv_container()}</span>
								</div>
								<div class="flex w-full justify-end">
									<Badge variant="ghost">{info?.containerId}</Badge>
								</div>
							</div>
						</div>
						<div
							class="grid grid-cols-1 divide-y border-t @md:grid-cols-2 @md:divide-x @md:divide-y-0"
						>
							<div class="flex items-center p-2">
								<div class="flex w-full items-center gap-2">
									<ActivityIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">{m.stats_app_uptime()}</span>
								</div>
								<div class="flex w-full justify-end">
									<Badge variant="ghost" class="px-0">
										{info?.uptime.hours}
										{m.time_short_hours()}
									</Badge>
									<Badge variant="ghost" class="px-0">
										{info?.uptime.minutes}
										{m.time_short_minutes()}
									</Badge>
									{#if info && info?.uptime?.hours && info.uptime.hours < 99}
										<Badge variant="ghost" class=" ps-0">
											{info?.uptime.seconds}
											{m.time_short_seconds()}
										</Badge>
									{/if}
								</div>
							</div>
							<div class="flex items-center p-2">
								<div class="flex w-full items-center gap-2">
									<ComputerIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">{m.stats_app_srv_uptime()}</span>
								</div>
								<div class="flex w-full justify-end">
									<Badge variant="ghost" class="px-0">
										{info?.srv_uptime.hours}
										{m.time_short_hours()}
									</Badge>
									<Badge variant="ghost" class="px-0">
										{info?.srv_uptime.minutes}
										{m.time_short_minutes()}
									</Badge>
									{#if info && info?.srv_uptime?.hours && info.srv_uptime.hours < 99}
										<Badge variant="ghost" class="ps-0">
											{info?.srv_uptime.seconds}
											{m.time_short_seconds()}
										</Badge>
									{/if}
								</div>
							</div>
						</div>
						<div class="flex w-full flex-col justify-between bg-border @md:flex-row @2xl:h-8">
							<p class="w-full border-t p-2 text-xs @sm:w-max">
								{m.stats_app_helper({ appname: info?.appname || 'SNAPPb' })}
							</p>
							<ButtonGroup class="xl:ms-auto">
								<Button
									variant="outline"
									size="sm"
									class="items-center gap-2 rounded-none "
									href="https://github.com/urania-dev/snapp"
									target="_blank"
								>
									<GithubIcon class="size-4!" />
									<span class="@xl:text-xs tracking-wide">Github</span>
								</Button>
								<Button
									href="https://hub.docker.com/r/uraniadev/snapp"
									target="_blank"
									variant="outline"
									size="sm"
									class="items-center gap-2 rounded-none"
									>{@const url = 'url(https://cdn.simpleicons.org/docker/black)'}
									<div
										class=" flex h-4! w-4! shrink-0 bg-foreground"
										style:mask="{url} no-repeat center / contain;"
										style:-webkit-mask="{url} no-repeat center / contain;"
									>
										<span class="sr-only">docker</span>
									</div>
									<span class="@xl:text-xs tracking-wide">DockerHub</span>
								</Button>
							</ButtonGroup>
						</div>
					</Item.Content>
				</Item.Root>
			</Item.ItemGroup>
		</Item.Root>
	</svelte:boundary>
</div>
