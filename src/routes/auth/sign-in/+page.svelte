<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeClosedIcon from '@lucide/svelte/icons/eye-closed';
	import KeyIcon from '@lucide/svelte/icons/key-round';
	import Link2Icon from '@lucide/svelte/icons/link-2';
	import UserRoundIcon from '@lucide/svelte/icons/user-round';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getAuthClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { Separator } from '$lib/components/ui/separator/index';
	import { m } from '$lib/paraglide/messages';
	import { login } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';
	const { data } = $props();
	let showPassword = $state(false);
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
				{...login.enhance(async ({ submit }) => {
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
					<Field.Field
						data-invalid={Array.isArray(login.fields.username.issues())}
						class="shrink-0"
					>
						<Field.Label for="username">{m.username()}</Field.Label>
						<InputGroup.Root>
							<InputGroup.Addon><UserRoundIcon class="size-5!" /></InputGroup.Addon>
							<InputGroup.Input
								id="username"
								placeholder={m.placeholders_auth_username()}
								{...login.fields.username.as('text')}
							/>
						</InputGroup.Root>
						{#each login.fields.username.issues() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description>{m.helpers_auth_username()}</Field.Description>
						{/each}
					</Field.Field>
					<Field.Field data-invalid={Array.isArray(login.fields._password.issues())} class="w-full">
						<Field.Label for="password">{m.password()}</Field.Label>
						<ButtonGroup class="w-full">
							<InputGroup.Root>
								<InputGroup.Addon><KeyIcon class="size-5!" /></InputGroup.Addon>
								<InputGroup.Input
									id="password"
									class="w-full"
									placeholder={m.placeholders_auth_password()}
									{...login.fields._password.as(showPassword ? 'text' : 'password')}
								/>
							</InputGroup.Root>
							<Button size="icon" onclick={() => (showPassword = !showPassword)}
								>{#if showPassword}<EyeIcon />{:else}<EyeClosedIcon />{/if}</Button
							>
						</ButtonGroup>
						{#each login.fields._password.issues() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description>{m.helpers_auth_password()}</Field.Description>
						{/each}
						<Button
							variant="link"
							href={resolve('/auth/forgot-password')}
							class="mb-2 h-4 max-w-max p-0">{m.auth_forgot_password()}</Button
						>
					</Field.Field>
					<Button type="submit">{m.auth_sign_in()}</Button>
				</Field.FieldSet>
			</form>
			<div class="flex w-full flex-col gap-4">
				<Separator orientation="horizontal" />
				{#each data.accountProviders as providerId (providerId)}
					<Button
						variant="outline"
						class="cursor-pointer capitalize"
						onclick={async () => {
							const host = data.host;
							const authClient = getAuthClient(host.origin, page.data.fetch);
							await authClient.signIn.oauth2({ providerId });
						}}>{providerId}</Button
					>
				{/each}
			</div>
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
		<Button class="inline px-0" href="/privacy-policy" variant="link">{m.read_more()}</Button>.
	</div>
</div>
