<script lang="ts">
	import Badge from "$lib/components/ui/badge/badge.svelte";

	const { utms }: { utms: string } = $props();

	const params = $derived((JSON.parse(utms) as string[][]).length);
</script>

<div class="flex w-full flex-wrap justify-center gap-1 px-2">
	{#if params}
		<Badge class="cursor-default">{params}</Badge>
	{:else}
		<i class="ph ph-minus text-[20px]"></i>
	{/if}
</div>
