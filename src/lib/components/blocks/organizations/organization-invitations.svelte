<script lang="ts">
	import BuildingIcon from '@lucide/svelte/icons/building';
	import GroupIcon from '@lucide/svelte/icons/group';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import EmailIcon from '@lucide/svelte/icons/mail';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Empty from '$lib/components/ui/empty';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Item from '$lib/components/ui/item';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Tabs from '$lib/components/ui/tabs';
	import { m } from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	import type { Organization } from './organizations.columns.svelte';

	let {
		invitations,
		selected,
		showInviteUser = $bindable()
	}: {
		invitations: Organization['invitations'];
		selected: null | string;
		showInviteUser: boolean;
	} = $props();
	let tab = $state<string>('none');

	const invitationStatus = (s: 'accepted' | 'canceled' | 'pending' | 'rejected') => {
		switch (s) {
			case 'accepted':
				return m.accepted();
			case 'canceled':
				return m.canceled();
			case 'pending':
				return m.pending();
			case 'rejected':
				return m.rejected();
		}
	};
</script>

<Tabs.Root class="h-full min-h-[180px]  @2xl:flex-row!" bind:value={tab}>
	<div class={[selected !== null ? 'opacity-100' : 'opacity-0', '@2xl:hidden']}>
		<InputGroup.Root class="rounded-none border-none">
			<InputGroup.Addon><EmailIcon /></InputGroup.Addon>
			<Select.Root type="single">
				<Select.Trigger class="w-full rounded-none border-none "
					>{m.select_from_list()}</Select.Trigger
				>
				<Select.Content align="start" alignOffset={-16}>
					{#each invitations as invitation (invitation.id)}
						<Select.Item value={invitation.id}>{invitation.email}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</InputGroup.Root>
	</div>
	<Tabs.List
		class="hidden h-full w-full max-w-[30%] flex-col {invitations?.length === 0
			? 'items-center justify-start'
			: 'items-start justify-start gap-1'} rounded-none {selected !== null ? '@2xl:flex' : ''}"
		><svelte:boundary>
			{#snippet pending()}
				<LoaderIcon class="animate-spin m-auto" />
			{/snippet}
			<Button
				variant="outline"
				class="w-full"
				onclick={() => {
					showInviteUser = !showInviteUser;
					tab = 'none';
				}}>{m.invite_user()}</Button
			>
			{#each invitations as invitation (invitation?.id)}
				<Tabs.Trigger
					class={buttonVariants({ class: 'h-10 max-h-10 w-full', variant: 'outline' })}
					value={invitation?.id}>{invitation?.email}</Tabs.Trigger
				>
			{/each}
		</svelte:boundary>
	</Tabs.List>

	{#each invitations as invitation (invitation.id)}
		{@const status = invitationStatus(invitation.status)}
		<Tabs.Content value={invitation?.id} class="flex min-h-[234px] flex-col gap-4 p-4">
			<Item.Root variant="muted" class="gap-0">
				<Item.Title>{m.invitation_has_been_sent()}</Item.Title>
				<Item.Description class="text-muted-foreground/80">
					{m.invitation_will_expire({
						on: invitation.expiresAt.toLocaleString(getLocale(), {
							dateStyle: 'short',
							timeStyle: 'short'
						})
					})}
				</Item.Description>
			</Item.Root>
			{#if invitation.expiresAt < new Date() && invitation.status === 'pending'}
				<Item.Root variant="muted" class="gap-0">
					<Item.Description class="text-destructive">
						{m.invitation_expired({
							on: invitation.expiresAt.toLocaleString(getLocale(), {
								dateStyle: 'short',
								timeStyle: 'short'
							})
						})}
					</Item.Description>
				</Item.Root>
			{/if}
			{#if invitation.status === 'accepted'}
				<Item.Root variant="muted" class="gap-0">
					<Item.Description>
						{m.invitation_has_been_accepted()}
					</Item.Description>
				</Item.Root>
			{/if}
			<div class="mt-auto flex flex-wrap items-center gap-4">
				{#if invitation.expiresAt <= new Date()}
					<Badge variant="destructive" class="rounded-sm">{m.expired()}</Badge>
				{/if}
				<Badge
					class={[
						'rounded-sm',
						invitation.status === 'pending' && 'bg-success',
						invitation.status === 'accepted' && 'bg-amber-500',
						invitation.status === 'rejected' && 'bg-destructive',
						invitation.status === 'rejected' && 'bg-destructive'
					]}
					variant={['accepted', 'pending'].includes(invitation.status) ? 'default' : 'destructive'}
					>{status}</Badge
				>
			</div>
		</Tabs.Content>
	{/each}

	<Tabs.Content id="none" value="none" class="flex h-full flex-col p-0">
		{#if selected && invitations?.length === 0}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<GroupIcon />
					</Empty.Media>
					<Empty.Title>{m.invitations()}</Empty.Title>
					<Empty.Description>{m.invitations_empty_helper()}</Empty.Description>
				</Empty.Header>
				<Empty.Content>
					<Button onclick={() => (showInviteUser = !showInviteUser)}>{m.invite_user()}</Button>
				</Empty.Content>
			</Empty.Root>
		{:else if selected && invitations?.length !== 0}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<GroupIcon />
					</Empty.Media>
					<Empty.Title>{m.invitations()}</Empty.Title>
					<Empty.Description class="hidden">{m.invitations_select_one()}</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{:else}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<BuildingIcon />
					</Empty.Media>
					<Empty.Title>{m.organization()}</Empty.Title>
					<Empty.Description>{m.organizations_select_one()}</Empty.Description>
				</Empty.Header>
			</Empty.Root>
		{/if}
	</Tabs.Content>
</Tabs.Root>
