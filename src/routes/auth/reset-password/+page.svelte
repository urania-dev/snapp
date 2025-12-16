<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';
	import KeyIcon from '@lucide/svelte/icons/key-round';
	import Link2Icon from '@lucide/svelte/icons/link-2';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { ButtonGroup } from '$lib/components/ui/button-group';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { resetPassword } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	const { data } = $props();
</script>

<div class="p-4 m-auto">
	<Card.Root class="w-full max-w-md">
		<Card.Header>
			<Card.Title>
				<div class="flex items-center gap-2">
					<Link2Icon />
					<span>{data.appname}</span>
				</div>
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<form
				class="flex w-full flex-col gap-4"
				{...resetPassword.enhance(async ({ submit }) => {
					try {
						await submit();
					} catch (error) {
						console.error(error);
						toast.error(
							(error as { body?: { message?: string } })?.body?.message || m.errors_generic()
						);
					}
				})}
			>
				<Field.FieldSet>
					<input hidden name="token" value={page.url.searchParams.get('token')?.toString()} />
					<Field.Field data-invalid={Array.isArray(resetPassword.fields._password.issues?.())}>
						<Field.Label for="password">{m.password()}</Field.Label>
						<ButtonGroup>
							<InputGroup.Root>
								<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
								<InputGroup.Input
									id="password"
									placeholder={m.placeholders_auth_password()}
									{...resetPassword.fields._password.as(showPassword ? 'password' : 'text')}
								/>
							</InputGroup.Root>
							<Button size="icon" onclick={() => (showPassword = !showPassword)}
								>{#if showPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
							>
						</ButtonGroup>
						{#each resetPassword.fields._password.issues?.() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description>{m.helpers_auth_password()}</Field.Description>
						{/each}
					</Field.Field>
					<Field.Field data-invalid={Array.isArray(resetPassword.fields._password.issues?.())}>
						<Field.Label for="confirmPassword">{m.confirm_password()}</Field.Label>
						<ButtonGroup>
							<InputGroup.Root>
								<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
								<InputGroup.Input
									id="confirmPassword"
									placeholder={m.placeholders_auth_password_again()}
									{...resetPassword.fields._confirmPassword.as(
										showConfirmPassword ? 'password' : 'text'
									)}
								/>
							</InputGroup.Root>
							<Button size="icon" onclick={() => (showConfirmPassword = !showConfirmPassword)}
								>{#if showConfirmPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
							>
						</ButtonGroup>
						{#each resetPassword.fields._confirmPassword.issues?.() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description>{m.helpers_auth_password_security()}</Field.Description>
						{/each}
					</Field.Field>
					<Button type="submit">{m.confirm()}</Button>
				</Field.FieldSet>
			</form>
		</Card.Content>
		<Card.Footer class="leading-md inline text-sm text-balance"
			><span
				>{m.auth_goto_sign_up_helper()}
				<Button variant="link" href="/auth/sign-up" class="inline p-0"
					>{m.auth_goto_sign_up()}</Button
				></span
			></Card.Footer
		>
	</Card.Root>
	<div class="leading-md mx-auto mt-2 max-w-md text-center text-sm text-balance">
		<span>{m.privacy_disclaimer()}</span>
		<Button class="inline px-0" href="/privacy-policy" variant="link">{m.read_more()}</Button>
	</div>
</div>
