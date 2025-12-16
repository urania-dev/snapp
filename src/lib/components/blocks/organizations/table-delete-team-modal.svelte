<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { m } from '$lib/paraglide/messages';
	import { deleteTeams } from '$lib/remotes/organizations.remote';

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

<Dialog bind:open={showDelete} title={m.ask_sure()} description={m.teams_delete()}>
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
					const success = await deleteTeams(ids);
					if (success) {
						showDelete = false;
						clearSelection();
						await invalidateAll();
					}
				} catch (error) {
					console.error('[teams] delete org FE', error);
				}
			}}
		>
			{m.delete()}
		</Button>
	</div>
</Dialog>
