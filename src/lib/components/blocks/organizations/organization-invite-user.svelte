<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';
	import type { UserWithRole } from 'better-auth/plugins';

	import BadgeCheckIcon from '@lucide/svelte/icons/badge-check';
	import LoaderIcon from '@lucide/svelte/icons/loader';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { type AuthClient, getAuthClient } from '$lib/auth/client';
	import * as Avatar from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Select from '$lib/components/ui/native-select';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Debouncer } from '$lib/hooks/debounce.svelte';
	import { m } from '$lib/paraglide/messages';
	import { toast } from 'svelte-sonner';

	import type { Organization } from './organizations.columns.svelte';

	import Dialog from '../commons/dialog.svelte';

	let {
		host,
		members,
		organizationId,
		showInviteUser = $bindable()
	}: {
		host: THost;
		members: Organization['members'];
		organizationId: string;
		showInviteUser: boolean;
	} = $props();

	let query = $state<string>();
	const auth: AuthClient = $derived(getAuthClient(host.origin, page.data.fetch));

	const d = new Debouncer();
	type Member = { username: string } & UserWithRole;

	let role = $state<'admin' | 'member'>('member');
	let selected = $state<Member[]>([]);

	const membersIds = $derived(members.map(({ userId }) => userId));
</script>

<Dialog
	title={m.invite_user()}
	description={m.invitations_empty_helper()}
	bind:open={showInviteUser}
>
	<div class="flex min-h-60 w-full flex-col">
		<svelte:boundary>
			{#snippet pending()}
				<LoaderIcon class="m-auto animate-spin" />
			{/snippet}
			{@const res = await auth.admin.listUsers({
				query: {
					limit: 3,
					searchField: 'email',
					searchOperator: 'starts_with',
					searchValue: query
				}
			})}
			<div class="flex h-full flex-col gap-4">
				<Field.FieldSet>
					<Field.Field>
						<Field.Label>{m.search()}</Field.Label>
						<InputGroup.Root>
							<InputGroup.Addon>
								<UserRoundIcon class="size-4!" />
							</InputGroup.Addon>
							<InputGroup.Input
								oninput={(e) => {
									const value = e.currentTarget.value;
									d.debounce(() => {
										query = value;
									}, 500)();
								}}
								placeholder={m.placeholders_user_search()}
								type="text"
							/>
						</InputGroup.Root>
						<Field.Description>{m.search_users_helper()}</Field.Description>
					</Field.Field>
				</Field.FieldSet>
				{#each (res?.data?.users || []) as Member[] as user (user)}
					{#if !membersIds.includes(user.id)}
						<Field.Label class="flex w-full flex-col" for="user-{user.id}">
							<Field.Field class="flex flex-row items-center justify-start gap-2">
								<Checkbox
									id="user-{user.id}"
									hidden
									checked={selected.map(({ id }) => id).includes(user.id)}
									onCheckedChange={(ch) => {
										if (ch) {
											selected.push(user);
										} else {
											selected = selected.filter(({ id }) => id !== user.id);
										}
									}}
								/>
								<Avatar.Root class="h-12 w-12 max-w-12 rounded-sm">
									<Avatar.Image src={user.image} class="h-12 w-12 rounded-sm " />
									<Avatar.Fallback class="h-12 w-12 rounded-sm bg-secondary font-bold uppercase"
										>{user.username.slice(0, 2)}</Avatar.Fallback
									>
								</Avatar.Root>
								<Field.Content class="flex flex-col gap-1">
									<p class="text-base leading-[1em] font-semibold">{user.username}</p>
									<div class="flex gap-1">
										<span class=" font-normal">{user.email}</span>
										<Tooltip.Provider>
											<Tooltip.Root>
												<Tooltip.Trigger
													><BadgeCheckIcon
														class={[
															user.emailVerified ? 'opacity-100' : 'opacity-0',
															'size-4! fill-secondary/20 text-secondary'
														]}
													/></Tooltip.Trigger
												>
												<Tooltip.Content>
													{#if user.emailVerified}
														<p>{m.email_verified()}</p>
													{:else}
														<p>{m.email_to_verify()}</p>
													{/if}
												</Tooltip.Content>
											</Tooltip.Root>
										</Tooltip.Provider>
									</div>
								</Field.Content>
							</Field.Field>
						</Field.Label>
					{/if}
				{/each}
				{#if res?.data?.users
					.map(({ id }) => id)
					.every((uid) => {
						return membersIds.includes(uid);
					})}
					<p class="text-sm text-muted-foreground/80">{m.no_users_found()}</p>
					<div class="flex max-w-max">
						<Button variant="link" size="sm" class="max-w-max px-0!" href={resolve('/users')}
							>{m.goto_users()}</Button
						>
					</div>
				{:else}
					<Field.Field class="gap-2">
						<Field.Label for="role">{m.role()}</Field.Label>
						<Select.Root bind:value={role} class="w-full! max-w-none">
							<Select.Option class="rounded-none" value="member">{m.member()}</Select.Option>
							<Select.Option class="rounded-none" value="admin">{m.admin()}</Select.Option>
						</Select.Root>
					</Field.Field>
				{/if}
			</div>
			<div
				class="flex h-10 items-center gap-2 transition-all {selected.length
					? 'opacity-100'
					: 'opacity-20'}"
			>
				<span class="text-sm font-semibold">{m.invite_selected_users()}</span><span
					class="font-mono">[{selected.length}]</span
				>
			</div>
			<ButtonGroup class="mt-2 w-full">
				<Button class=" grow" variant="outline" onclick={() => (showInviteUser = false)}
					>{m.cancel()}</Button
				>
				<Button
					disabled={selected.length === 0}
					class="grow"
					onclick={async () => {
						try {
							await Promise.all(
								selected.map(async (u) => {
									await auth.organization.inviteMember({
										email: u.email,
										organizationId,
										resend: true,
										role
									});
								})
							);
							toast.success(m.invitation_sent_to_users());
							showInviteUser = false;
							await invalidateAll();
						} catch (error) {
							console.error(error);
							toast.error(m.errors_settings_saving());
						}
					}}>{m.confirm()}</Button
				>
			</ButtonGroup>
		</svelte:boundary>
	</div>
</Dialog>
