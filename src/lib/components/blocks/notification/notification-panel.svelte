<script lang="ts">
	import { getLocalTimeZone } from '@internationalized/date';
	import NotifyIcon from '@lucide/svelte/icons/bell';
	import NotifyDotIcon from '@lucide/svelte/icons/bell-dot';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Item from '$lib/components/ui/item';
	import * as Popover from '$lib/components/ui/popover';
	import { Separator } from '$lib/components/ui/separator';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { PersistedState } from 'runed';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	const {
		data
	}: {
		data: {
			invitations: {
				createdAt: Date;
				email: string;
				expiresAt: Date;
				id: string;
				inviterId: string;
				organization: {
					createdAt: Date;
					id: string;
					logo: null | string;
					metadata: null | string;
					name: string;
					slug: string;
				};
				organizationId: string;
				role: null | string;
				status: string;
				teamId: null | string;
				user: {
					banExpires: Date | null;
					banned: boolean | null;
					banReason: null | string;
					createdAt: Date;
					displayUsername: null | string;
					email: string;
					emailVerified: boolean;
					id: string;
					image: null | string;
					name: string;
					notes: null | string;
					role: null | string;
					twoFactorEnabled: boolean | null;
					updatedAt: Date;
					username: null | string;
				};
			}[];
			lastLogin: Date | undefined;
		};
	} = $props();
	type TNotif = {
		createdAt: Date;
		id: string;
		invitationId?: string;
		message?: string;
		read: boolean;
	};
	const storage = new PersistedState('notifications', [] as TNotif[]);
	onMount(() => {
		createNotification({
			createdAt: data.lastLogin || new Date(),
			id: 'lastLogin',
			message: m.last_login(),
			read: false
		});
		data?.invitations?.map(inviteNotification);
	});

	const createNotification = (n: TNotif) => {
		const idx = storage.current.findIndex((_n) => _n.id === n.id);
		if (idx === -1) storage.current.push(n);
	};

	const inviteNotification = (i: (typeof data.invitations)[number]) => {
		const id = `invitation-${i.organization.name}-${i.organization.createdAt.toISOString()}`;
		const createdAt = i.createdAt;
		const message = m.notification_invited_to_org({
			inviter: i.user.username || i.inviterId,
			orgName: i.organization.name
		});
		const notify = { createdAt, id, invitationId: i.id, message, read: false };
		createNotification(notify);
	};

	const notifications = $derived(Array.from(storage.current));
	let offset = $state(0);
	let showDelete = $state<string>();

	const authClient = $derived(getAuthClient(page.data.host.origin, page.data.fetch));
</script>

<Popover.Root>
	<Popover.Trigger class={buttonVariants({ class: 'size-14! rounded-none', variant: 'ghost' })}>
		{#if notifications.some((n) => !n.read)}
			<NotifyDotIcon class="size-4! animate-shake fill-current/20 text-destructive opacity-100" />
		{:else}
			<NotifyIcon class="size-4! opacity-50" />
		{/if}
	</Popover.Trigger>
	<Popover.Content class="p-0" align="end" alignOffset={6}>
		<div class="flex flex-col gap-2 p-2">
			<ButtonGroup class="w-full">
				<Button variant="outline" class="grow" size="sm">{m.read_all()}</Button>
				<Button class="grow" size="sm">{m.load_more()}</Button>
			</ButtonGroup>
			{#each notifications.slice(offset, 5) as n (n)}
				{#if n.message}
					{@render Notification(n)}
				{/if}
			{/each}
		</div>
	</Popover.Content>
</Popover.Root>

{#snippet Notification(n: TNotif)}
	<div in:fly|global={{ y: 12 }}>
		<Item.Root
			onclick={() => {
				if (n.read !== true) {
					const idx = storage.current.findIndex((nt) => nt.id === n.id)!;
					n.read = true;
					storage.current.splice(idx, 1, n);
				} else {
					if (showDelete === n.id) showDelete = undefined;
					else showDelete = n.id;
				}
			}}
			variant={n.read ? 'default' : 'muted'}
			class={[n.read ? '' : 'border border-secondary/50', 'relative p-2 hover:bg-secondary/20']}
		>
			{#if showDelete === n.id}
				<div class="absolute top-2 right-2" transition:fly={{ x: 4 }}>
					<Button
						class="size-6!"
						size="icon-sm"
						onclick={() => {
							const idx = storage.current.findIndex((ntf) => ntf.id === n.id);
							if (idx > -1 && n.id.startsWith('invitation')) storage.current.splice(idx, 1);
							else if (idx > -1)
								storage.current.splice(idx, 1, { ...n, message: undefined, read: true });
						}}><TrashIcon class="size-4!" /></Button
					>
				</div>
			{/if}
			<Item.Content>
				<Item.Title class={['text-balance']}>
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					<p>{@html n.message}</p>
				</Item.Title>
				<Item.Description class="@xl:text-xs"
					>{new Date(n.createdAt).toLocaleString(getLocale(), {
						dateStyle: 'short',
						timeStyle: 'short',
						timeZone: getLocalTimeZone()
					})}</Item.Description
				>
				<Item.Actions>
					{#if n.id.startsWith('invitation')}
						{#if n.invitationId}
							<ButtonGroup class="mt-2">
								<Button
									size="sm"
									variant="outline"
									onclick={async (e) => {
										e.preventDefault();
										e.stopPropagation();
										if (!n.invitationId) return;

										const i = data.invitations.find((i) => i.id === n.invitationId);
										try {
											await authClient.organization.rejectInvitation({
												invitationId: n.invitationId
											});
											n.message = m.invitation_rejected({
												orgName: i?.organization?.name || m.organization()
											});
											n.invitationId = undefined;
											const idx = storage.current.findIndex((ntf) => ntf.id === n.id);
											if (idx > -1) storage.current.splice(idx, 1, n);
										} catch (error) {
											console.error(error);
										}
									}}>{m.cancel()}</Button
								>
								<Button
									size="sm"
									onclick={async (e) => {
										e.preventDefault();
										if (!n.invitationId) return;

										const i = data.invitations.find((i) => i.id === n.invitationId);

										try {
											await authClient.organization.acceptInvitation({
												invitationId: n.invitationId
											});
											n.message = m.invitation_accepted({
												orgName: i?.organization?.name || m.organization()
											});
											n.invitationId = undefined;
											const idx = storage.current.findIndex((ntf) => ntf.id === n.id);
											if (idx > -1) storage.current.splice(idx, 1, n);
										} catch (error) {
											console.error(error);
										}
									}}
									class="bg-success hover:bg-success/80">{m.confirm()}</Button
								>
							</ButtonGroup>
						{/if}
					{/if}
				</Item.Actions>
			</Item.Content>
		</Item.Root>
	</div>
	<Separator class="last:hidden" />
{/snippet}
