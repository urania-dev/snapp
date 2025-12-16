<script lang="ts">
	import MailIcon from '@lucide/svelte/icons/mail';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import * as Field from '$lib/components/ui/field';
	import * as InputGroup from '$lib/components/ui/input-group';
	import * as Select from '$lib/components/ui/native-select';
	import { m } from '$lib/paraglide/messages';
	import { inviteUser } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';

	import Dialog from '../commons/dialog.svelte';

	let { open = $bindable() }: { open: boolean } = $props();
</script>

<Dialog bind:open title={m.invite_user()} description={m.invite_user_helper()}>
	<form
		class="flex w-full flex-col gap-4"
		{...inviteUser.enhance(async ({ submit }) => {
			try {
				await submit();
				if (inviteUser.result) {
					await invalidateAll();
					open = false;
				}
			} catch (error) {
				console.error(error);
				toast.error(
					(error as { body?: { message?: string } })?.body?.message || m.errors_generic()
				);
			}
		})}
	>
		<Field.FieldSet class="w-full flex flex-col gap-2">
			<Field.Field data-invalid={Array.isArray(inviteUser.fields.email.issues())} class="shrink-0">
				<Field.Label for="email">{m.email()}</Field.Label>
				<InputGroup.Root>
					<InputGroup.Addon><MailIcon class="size-5!" /></InputGroup.Addon>
					<InputGroup.Input
						id="email"
						placeholder={m.placeholders_auth_email()}
						{...inviteUser.fields.email.as('text')}
					/>
				</InputGroup.Root>
				{#each inviteUser.fields.email.issues() as issue (issue)}
					<Field.Error>{issue.message}</Field.Error>
				{:else}
					<Field.Description>{m.helpers_auth_email()}</Field.Description>
				{/each}
			</Field.Field>
			<Field.Field class="gap-2">
				<Field.Label for="role">{m.role()}</Field.Label>
				<Select.Root class="w-full! max-w-none" {...inviteUser.fields.role.as('select')}>
					<Select.Option class="rounded-none" value="user">{m.user()}</Select.Option>
					<Select.Option class="rounded-none" value="admin">{m.admin()}</Select.Option>
				</Select.Root>
				{#each inviteUser.fields.role.issues() as issue (issue)}
					<Field.Error>{issue.message}</Field.Error>
				{:else}
					<Field.Description class="text-balance">{m.role_helper()}</Field.Description>
				{/each}
			</Field.Field>
			<ButtonGroup class="w-full mt-2">
				<Button class="grow" onclick={() => (open = false)} variant="outline">{m.cancel()}</Button>
				<Button class="grow" type="submit">{m.invite_user()}</Button>
			</ButtonGroup>
		</Field.FieldSet>
	</form>
</Dialog>
