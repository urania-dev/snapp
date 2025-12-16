<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { deleteUsers } from '$lib/remotes/auth.remote';
	import { toast } from 'svelte-sonner';

	let {
		clearSelection,
		getRows,
		showDelete = $bindable()
	}: {
		clearSelection: () => void;
		getRows: () => { id: string }[];
		showDelete: boolean;
	} = $props();

	import Dialog from '../commons/dialog.svelte';
</script>

<Dialog bind:open={showDelete} title={m.ask_sure()} description={m.users_delete_helper()}>
	<div class="flex w-full justify-between gap-4">
		<Button
			variant="outline"
			onclick={() => {
				showDelete = false;
			}}
			class={buttonVariants({ class: 'grow', variant: 'outline' })}
		>
			{m.cancel()}
		</Button>
		<Button
			variant="destructive"
			class="grow"
			onclick={async () => {
				try {
					const ids = getRows().map(({ id }) => id);
					const success = await deleteUsers(ids);
					if (success) {
						showDelete = false;
						clearSelection();
						await invalidateAll();
					}
				} catch (error) {
					console.error('[users] delete users FE', error);
					toast.error(
						(error as { body?: { message?: string } })?.body?.message || m.errors_generic()
					);
				}
			}}
		>
			{m.delete()}
		</Button>
	</div>
</Dialog>
