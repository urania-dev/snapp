<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';
	import KeyIcon from '@lucide/svelte/icons/key-round';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { changePassword } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';

	import { Button } from '../button';
	import Dialog from '../commons/dialog.svelte';
	let { showChangePass = $bindable(), user }: { showChangePass: boolean; user: User } = $props();
	let showNewPassword = $state(false);
	let showConfirmPassword = $state(false);
	let showPassword = $state(false);
</script>

<Dialog
	title={m.change_password()}
	description={m.change_password_helper()}
	bind:open={showChangePass}
>
	<form
		id="change-password"
		{...changePassword.enhance(async ({ form, submit }) => {
			try {
				await submit();
				if (changePassword.result) {
					showChangePass = false;
					form.reset();
				}
			} catch (error) {
				console.error(error);
				toast.error(
					(error as { body?: { message?: string } })?.body?.message || m.errors_saving_profile()
				);
			}
		})}
		class="flex w-full max-w-lg grow flex-col gap-4"
	>
		<input type="text" hidden value={user.username} />
		<Field.FieldSet>
			<Field.Field data-invalid={Array.isArray(changePassword.fields._password.issues())}>
				<Field.Label for="Password">{m.password()}</Field.Label>
				<ButtonGroup>
					<InputGroup.Root>
						<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
						<InputGroup.Input
							id="Password"
							placeholder={m.placeholders_auth_password()}
							{...changePassword.fields._password.as(showPassword ? 'text' : 'password')}
						/>
					</InputGroup.Root>
					<Button size="icon" onclick={() => (showPassword = !showPassword)}
						>{#if showPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
					>
				</ButtonGroup>
				{#each changePassword.fields._password.issues() as issue (issue)}
					<Field.Error>{issue.message}</Field.Error>
				{:else}
					<Field.Description>{m.helpers_auth_password()}</Field.Description>
				{/each}
			</Field.Field>
			<Field.Field data-invalid={Array.isArray(changePassword.fields._newPassword.issues())}>
				<Field.Label for="newPassword">{m.new_password()}</Field.Label>
				<ButtonGroup>
					<InputGroup.Root>
						<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
						<InputGroup.Input
							id="newPassword"
							placeholder={m.placeholders_auth_password()}
							{...changePassword.fields._newPassword.as(showNewPassword ? 'text' : 'password')}
						/>
					</InputGroup.Root>
					<Button size="icon" onclick={() => (showNewPassword = !showNewPassword)}
						>{#if showNewPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
					>
				</ButtonGroup>
				{#each changePassword.fields._newPassword.issues() as issue (issue)}
					<Field.Error>{issue.message}</Field.Error>
				{:else}
					<Field.Description>{m.helpers_auth_password()}</Field.Description>
				{/each}
			</Field.Field>
			<Field.Field data-invalid={Array.isArray(changePassword.fields._confirmPassword.issues())}>
				<Field.Label for="confirmPassword">{m.confirm_password()}</Field.Label>
				<ButtonGroup>
					<InputGroup.Root>
						<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
						<InputGroup.Input
							id="confirmPassword"
							placeholder={m.placeholders_auth_password_again()}
							{...changePassword.fields._confirmPassword.as(
								showConfirmPassword ? 'text' : 'password'
							)}
						/>
					</InputGroup.Root>
					<Button size="icon" onclick={() => (showConfirmPassword = !showConfirmPassword)}
						>{#if showConfirmPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
					>
				</ButtonGroup>
				{#each changePassword.fields._confirmPassword.issues() as issue (issue)}
					<Field.Error>{issue.message}</Field.Error>
				{:else}
					<Field.Description>{m.helpers_auth_password_security()}</Field.Description>
				{/each}
			</Field.Field>
			<Button type="submit">{m.confirm()}</Button>
		</Field.FieldSet>
	</form>
</Dialog>
