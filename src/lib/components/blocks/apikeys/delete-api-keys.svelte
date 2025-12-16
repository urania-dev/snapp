<script lang="ts">
	import ButtonGroup from '$lib/components/ui/button-group/button-group.svelte';
	import { m } from '$lib/paraglide/messages';

	import { Button } from '../button';
	import Dialog from '../commons/dialog.svelte';
	let {
		close,
		confirmed,
		open = $bindable()
	}: { close?: () => void; confirmed?: () => Promise<void>; open: boolean } = $props();
</script>

<Dialog bind:open title={m.ask_sure()} description={m.api_key_delete()}>
	<ButtonGroup>
		<Button
			variant="outline"
			onclick={() => {
				open = false;
				close?.();
			}}>{m.cancel()}</Button
		>
		<Button
			variant="destructive"
			onclick={async () => {
				open = false;
				await confirmed?.();
			}}>{m.confirm()}</Button
		>
	</ButtonGroup>
</Dialog>
