<script lang="ts">
	import Link2Icon from '@lucide/svelte/icons/link-2';
	import EmailIcon from '@lucide/svelte/icons/mail';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import { m } from '$lib/paraglide/messages';
	import { forgotPassword } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';
	let sent = $state(0);
	let interval = $state<NodeJS.Timeout>();
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
				{...forgotPassword.enhance(async ({ submit }) => {
					try {
						await submit();
						if (forgotPassword.result === true) {
							clearInterval(interval);
							sent = 30;
							interval = setInterval(() => {
								sent--;
								if (sent === 0) clearInterval(interval);
							}, 1000);
						}
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
						data-invalid={Array.isArray(forgotPassword.fields.email.issues?.())}
						class="shrink-0"
					>
						<Field.Label for="email">{m.email()}</Field.Label>
						<InputGroup.Root>
							<InputGroup.Addon><EmailIcon class="size-5!" /></InputGroup.Addon>
							<InputGroup.Input
								{...forgotPassword.fields.email.as('email')}
								id="email"
								placeholder={m.placeholders_auth_email()}
							/>
						</InputGroup.Root>
						{#each forgotPassword.fields.email.issues?.() as issue (issue)}
							<Field.Error>{issue.message}</Field.Error>
						{:else}
							<Field.Description>{m.helpers_auth_email()}</Field.Description>
						{/each}
					</Field.Field>
					<Button disabled={sent !== 0} type="submit"
						>{m.confirm()} {sent === 0 ? '' : `(${sent})`}</Button
					>
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
		<Button class="inline px-0" href="/privacy-policy" variant="link">{m.read_more()}</Button>.
	</div>
</div>
