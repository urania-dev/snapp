<script lang="ts">
	import type { Group } from '@prisma/client';

	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { queryParameters } from 'sveltekit-search-params';

	const { groups }: { groups: Group[] } = $props();
	const params = queryParameters({
		group: true
	});
</script>

<div class="flex w-full flex-wrap justify-center gap-1 px-2">
	{#each groups as group}
		<Badge
			onclick={() => {
				if (params.group === group.slug) params.group = null;
				else params.group = group.slug;
			}}>{group.name}</Badge
		>
	{/each}
</div>
