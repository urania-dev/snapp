<script lang="ts">
	import type { THost } from '$lib/schemas/host.schema';

	import LoadingIcon from '@lucide/svelte/icons/loader';
	import LockIcon from '@lucide/svelte/icons/lock';
	import LockOpenIcon from '@lucide/svelte/icons/lock-open';
	import EmailIcon from '@lucide/svelte/icons/mail';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import { Badge } from '$lib/components/ui/badge';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Sheet from '$lib/components/ui/sheet/index';
	import { m } from '$lib/paraglide/messages';
	import { getAccounts, updateProfile } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';

	import { Button } from '../button';
	import ChangePassword from './change-password.svelte';
	const { accountProvider, host, user }: { accountProvider: string[]; host: THost; user: User } =
		$props();
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { value: _, ...spread } = $derived(updateProfile.fields.username.as('text'));
	let value = $derived(user.username);
	let showChangePass = $state(false);
	const accountsQuery = $derived(getAccounts());
	const open = $derived(page.url.hash === '#accounts');
	// svelte-ignore state_referenced_locally
	let showAccount = $state(open);
</script>

<form
	class="contents"
	{...updateProfile.enhance(async ({ submit }) => {
		try {
			await submit();
		} catch (error) {
			console.error(error);
			toast.error(m.errors_saving_profile());
		}
	})}
>
	<Field.FieldSet class="w-full max-w-md gap-2">
		<Field.Field
			data-invalid={Array.isArray(updateProfile.fields.username.issues())}
			class="w-full shrink-0"
		>
			<Field.Label for="username">{m.username()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon><UserRoundIcon class="size-5!" /></InputGroup.Addon>
				<InputGroup.Input
					id="username"
					placeholder={m.placeholders_auth_username()}
					{...spread}
					bind:value
				/>
			</InputGroup.Root>
			{#each updateProfile.fields.username.issues() as issue (issue)}
				<Field.Error>{issue.message}</Field.Error>
			{:else}
				<Field.Description>{m.helpers_auth_username()}</Field.Description>
			{/each}
		</Field.Field>
		<Field.Field class="w-full shrink-0">
			<Field.Label for="email">{m.email()}</Field.Label>
			<InputGroup.Root>
				<InputGroup.Addon><EmailIcon class="size-5!" /></InputGroup.Addon>
				<InputGroup.Input class="w-full" id="email" type="email" disabled value={user.email} />
				<InputGroup.Addon align="inline-end"
					><LockIcon class="size-5! opacity-50" /></InputGroup.Addon
				>
			</InputGroup.Root>
			<Field.Description>{m.helpers_auth_email()}</Field.Description>
		</Field.Field>
		<ButtonGroup class="mt-2">
			<Button
				variant="outline"
				onclick={() => {
					showChangePass = true;
				}}>{m.change_password()}</Button
			>
			<Button
				variant="outline"
				onclick={() => {
					showAccount = true;
				}}>{m.accounts()}</Button
			>
			<Button disabled={value === page.data.user.username} type="submit">{m.save_changes()}</Button>
		</ButtonGroup>
	</Field.FieldSet>
</form>
<ChangePassword {user} bind:showChangePass />
<Sheet.Root bind:open={showAccount}>
	<Sheet.Content>
		<Sheet.Header>
			<Sheet.Title>{m.accounts()}</Sheet.Title>
			<Sheet.Description class="text-balance">
				{m.accounts_helper()}
			</Sheet.Description>
		</Sheet.Header>
		<div class="flex h-full w-full flex-col gap-4 px-4">
			<svelte:boundary>
				{#snippet pending()}
					<LoadingIcon class="m-auto size-6!" />
				{/snippet}

				<ButtonGroup class="w-full">
					<Badge variant="outline" class="grow justify-start rounded-sm capitalize"
						>{m.credentials()}</Badge
					>
					<Button size="sm" class="rounded-sm @xl:text-xs" disabled>
						<LockIcon />
					</Button>
				</ButtonGroup>
				{@const accounts = await accountsQuery}
				{@const providers = accounts.map(({ providerId }) => providerId)}
				{#each accounts as account (account.id)}
					{#if account.providerId !== 'credential'}
						<ButtonGroup class="w-full">
							<Badge variant="outline" class="grow justify-start rounded-sm capitalize"
								>{account.providerId}</Badge
							>
							<Button
								size="sm"
								class="rounded-sm @xl:text-xs"
								onclick={async () => {
									const authClient = getAuthClient(host.origin, page.data.fetch);
									await authClient.unlinkAccount({
										accountId: account.accountId,
										providerId: account.providerId
									});
									await accountsQuery.refresh();
								}}
							>
								<span>{m.unlink()}</span>
								<LockOpenIcon />
							</Button>
						</ButtonGroup>
					{/if}
				{/each}
				{#each accountProvider || [] as available (available)}
					{#if !providers || !providers.includes(available)}
						<ButtonGroup class="w-full">
							<Badge variant="outline" class="grow justify-start rounded-sm capitalize"
								>{available}</Badge
							>
							<Button
								size="sm"
								class="rounded-sm @xl:text-xs"
								onclick={async () => {
									const authClient = getAuthClient(host.origin, page.data.fetch);
									await authClient.signIn.oauth2({
										callbackURL: `${host.origin}/settings/profile#accounts`,
										providerId: available
									});
								}}><span>{m.link()}</span><LockOpenIcon /></Button
							>
						</ButtonGroup>
					{/if}
				{/each}
			</svelte:boundary>
		</div>
	</Sheet.Content>
</Sheet.Root>
