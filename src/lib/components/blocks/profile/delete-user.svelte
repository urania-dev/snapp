<script lang="ts">
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as Field from '$lib/components/ui/field';
	import { m } from '$lib/paraglide/messages';
	import { deleteUser } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';

	import Dialog from '../commons/dialog.svelte';
	let open = $state(false);
</script>

<Field.Set class="w-full">
	<Field.Label class="border-destructive">
		<Field.Field orientation="horizontal" class=" bg-destructive/25">
			<Field.Content>
				<span>{m.delete_account()}</span>
				<Field.Description class="max-w-xl @xl:text-xs text-balance">
					{m.delete_user_helper()}
				</Field.Description>
			</Field.Content>
			<Button variant="destructive" onclick={() => (open = !open)} id="delete-user" type="submit"
				>{m.delete()}</Button
			>
		</Field.Field>
	</Field.Label>
</Field.Set>
<Dialog bind:open title={m.delete_account()} description={m.ask_sure_user()}>
	<form
		class="flex max-w-lg flex-col gap-4"
		{...deleteUser.enhance(async ({ submit }) => {
			try {
				await submit();
			} catch (error) {
				const message =
					(error as { body?: { message?: string } })?.body?.message || m.errors_saving_profile();
				console.error(error);
				toast.error(message);
			}
		})}
	>
		<ButtonGroup>
			<Button variant="outline" onclick={() => (open = false)}>{m.cancel()}</Button>
			<Button variant="destructive" type="submit">{m.confirm()}</Button>
		</ButtonGroup>
	</form>
</Dialog>
