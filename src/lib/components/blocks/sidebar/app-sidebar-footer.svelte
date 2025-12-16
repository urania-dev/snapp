<script lang="ts">
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import CogIcon from '@lucide/svelte/icons/cog';
	import DoorOpenIcon from '@lucide/svelte/icons/door-open';
	import UserRoundCogIcon from '@lucide/svelte/icons/user-round-cog';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index';
	import * as Sidebar from '$lib/components/ui/sidebar';
	import { m } from '$lib/paraglide/messages';
	const { user }: { user?: null | User } = $props();
	let open = $state(false);
</script>

<Sidebar.Footer class="pb-4">
	<Sidebar.Menu>
		<Sidebar.MenuItem>
			<DropdownMenu.Root bind:open>
				<DropdownMenu.Trigger
					class="group-data[collapsible=icon]:!h-12 group-data[collapsible=icon]:p-0! group-data[collapsible=icon]:w-12! group/button flex h-12 items-center p-0! data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:w-full"
				>
					{#snippet child({ props })}
						{@const image = user?.image}
						<Sidebar.MenuButton variant="outline" {...props}>
							<Avatar.Root class="h-full w-full max-w-12 rounded-none">
								{#if image}
									<Avatar.Image loading="lazy" class="animate-in fade-in" src={image} />
								{/if}
								<Avatar.Fallback class="rounded-none bg-secondary text-lg font-bold uppercase"
									>{user?.username?.slice(0, 1)}</Avatar.Fallback
								>
							</Avatar.Root>
							<div class="flex flex-col justify-center group-data-[collapsible=icon]:hidden!">
								<span class="font-semibold capitalize">{user?.username}</span>
								<small class="text-[0.625rem] font-bold tracking-wide uppercase">{user?.role}</small
								>
							</div>
							<ChevronUpIcon
								class="me-2 ml-auto size-5! transition-all group-data-[collapsible=icon]:hidden! group-data-[state=open]/button:-rotate-180"
							/>
						</Sidebar.MenuButton>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content
					side="top"
					align="start"
					sideOffset={8}
					class="min-w-(--bits-dropdown-menu-anchor-width)"
				>
					<DropdownMenu.Item class="p-0">
						<Button
							variant="ghost"
							class="h-full w-full justify-between px-2 py-1.5 text-sm"
							href={resolve('/settings/profile')}
						>
							<span>{m.profile()}</span>
							<UserRoundCogIcon />
						</Button>
					</DropdownMenu.Item>
					{#if user?.role === 'admin'}
						<DropdownMenu.Item class="p-0">
							<Button
								variant="ghost"
								class="h-full w-full justify-between px-2 py-1.5 text-sm"
								href={resolve('/settings')}
							>
								<span>{m.settings()}</span>
								<CogIcon />
							</Button>
						</DropdownMenu.Item>
					{/if}
					<DropdownMenu.Separator />
					<DropdownMenu.Item class="p-0">
						<Button
							variant="ghost"
							class="h-full w-full justify-between px-2 py-1.5 text-sm"
							onclick={async () => {
								const authClient = getAuthClient(page.url.origin, page.data.fetch);
								await authClient.signOut();
								await goto(resolve('/auth/sign-in'), { invalidateAll: true });
							}}
						>
							<span>{m.auth_sign_out()}</span>
							<DoorOpenIcon />
						</Button>
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</Sidebar.MenuItem>
	</Sidebar.Menu>
</Sidebar.Footer>
