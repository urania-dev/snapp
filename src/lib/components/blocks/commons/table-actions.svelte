<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { m } from '$lib/paraglide/messages';

	import DropDraw from './drop-draw.svelte';

	let open = $state(false);
	let { id }: { id: string } = $props();
</script>

<div class="flex w-full">
	<DropDraw
		class="w-7 h-7 ms-auto me-1"
		variant="outline"
		title={m.url()}
		items={[
			{
				Icon: PencilIcon,
				id: 'edit',
				label: m.edit(),
				onclick: async () => {
					await goto(resolve(`/urls/edit/[id]`, { id }));
				}
			}
		]}
		bind:open><EllipsisIcon /></DropDraw
	>
</div>
