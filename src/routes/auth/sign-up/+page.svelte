<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';
	import KeyIcon from '@lucide/svelte/icons/key-round';
	import Link2Icon from '@lucide/svelte/icons/link-2';
	import MailIcon from '@lucide/svelte/icons/mail';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import { Button } from '$lib/components/ui/button';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { signup } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let showVerifyEmail = $state(false);
	const { data } = $props();
</script>

<div class="p-4 m-auto flex flex-col">
	<Card.Root class="m-auto w-full max-w-md">
		<Card.Header>
			<Card.Title>
				<div class="flex items-center gap-2">
					<Link2Icon />
					<span>{data.appname}</span>
				</div>
			</Card.Title>
		</Card.Header>
		{#if !showVerifyEmail}
			<Card.Content>
				<form
					class="flex w-full flex-col gap-4"
					{...signup.enhance(async ({ submit }) => {
						try {
							await submit();
							showVerifyEmail = true;
						} catch (error) {
							console.error(error);
							toast.error(
								(error as { body?: { message?: string } })?.body?.message || m.errors_generic()
							);
						}
					})}
				>
					<Field.FieldSet>
						<Field.Field
							data-invalid={Array.isArray(signup.fields.username.issues())}
							class="shrink-0"
						>
							<Field.Label for="username">{m.username()}</Field.Label>
							<InputGroup.Root>
								<InputGroup.Addon><UserRoundIcon class="size-5!" /></InputGroup.Addon>
								<InputGroup.Input
									id="username"
									placeholder={m.placeholders_auth_username()}
									{...signup.fields.username.as('text')}
								/>
							</InputGroup.Root>
							{#each signup.fields.username.issues() as issue (issue)}
								<Field.Error>{issue.message}</Field.Error>
							{:else}
								<Field.Description>{m.helpers_auth_username()}</Field.Description>
							{/each}
						</Field.Field>
						<Field.Field
							data-invalid={Array.isArray(signup.fields.email.issues())}
							class="shrink-0"
						>
							<Field.Label for="email">{m.email()}</Field.Label>
							<InputGroup.Root>
								<InputGroup.Addon><MailIcon class="size-5!" /></InputGroup.Addon>
								<InputGroup.Input
									id="email"
									placeholder={m.placeholders_auth_email()}
									{...signup.fields.email.as('text')}
								/>
							</InputGroup.Root>
							{#each signup.fields.email.issues() as issue (issue)}
								<Field.Error>{issue.message}</Field.Error>
							{:else}
								<Field.Description>{m.helpers_auth_email()}</Field.Description>
							{/each}
						</Field.Field>
						<Field.Field data-invalid={Array.isArray(signup.fields._password.issues())}>
							<Field.Label for="password">{m.password()}</Field.Label>
							<ButtonGroup>
								<InputGroup.Root>
									<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
									<InputGroup.Input
										id="password"
										placeholder={m.placeholders_auth_password()}
										{...signup.fields._password.as(showPassword ? 'text' : 'password')}
									/>
								</InputGroup.Root>
								<Button size="icon" onclick={() => (showPassword = !showPassword)}
									>{#if showPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
								>
							</ButtonGroup>
							{#each signup.fields._password.issues() as issue (issue)}
								<Field.Error>{issue.message}</Field.Error>
							{:else}
								<Field.Description>{m.helpers_auth_password()}</Field.Description>
							{/each}
						</Field.Field>
						<Field.Field data-invalid={Array.isArray(signup.fields._password.issues())}>
							<Field.Label for="confirmPassword">{m.confirm_password()}</Field.Label>
							<ButtonGroup>
								<InputGroup.Root>
									<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
									<InputGroup.Input
										id="confirmPassword"
										placeholder={m.placeholders_auth_password_again()}
										{...signup.fields._confirmPassword.as(
											showConfirmPassword ? 'text' : 'password'
										)}
									/>
								</InputGroup.Root>
								<Button size="icon" onclick={() => (showConfirmPassword = !showConfirmPassword)}
									>{#if showConfirmPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
								>
							</ButtonGroup>
							{#each signup.fields._confirmPassword.issues() as issue (issue)}
								<Field.Error>{issue.message}</Field.Error>
							{:else}
								<Field.Description>{m.helpers_auth_password_security()}</Field.Description>
							{/each}
						</Field.Field>
						<Button type="submit">{m.auth_sign_up()}</Button>
					</Field.FieldSet>
				</form>
			</Card.Content>
		{/if}
		<Card.Footer class="leading-md inline text-sm text-balance">
			{#if !showVerifyEmail}
				<span
					>{m.auth_goto_sign_in_helper()}
					<Button variant="link" href="/auth/sign-in" class="inline p-0"
						>{m.auth_goto_sign_in()}</Button
					></span
				>{:else}
				<p>{m.sent_verification_email()}</p>
			{/if}</Card.Footer
		>
	</Card.Root>
	<div class="leading-md mx-auto mt-2 max-w-md text-center text-sm text-balance">
		<span>{m.privacy_disclaimer()}</span>
		<Button class="inline px-0" href="/privacy-policy" variant="link">{m.read_more()}</Button>.
	</div>
</div>
