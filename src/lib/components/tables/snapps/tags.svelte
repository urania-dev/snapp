<script lang="ts">
	import type { Tag } from '@prisma/client';

	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { queryParameters } from 'sveltekit-search-params';

	const { tags }: { tags: Tag[] } = $props();
	const params = queryParameters({
		tag: true
	});
</script>

<div class="flex w-full flex-wrap justify-center gap-1 px-2">
	{#each tags as tag}
		<Badge
			onclick={() => {
				if (params.tag === tag.slug) params.tag = null;
				else params.tag = tag.slug;
			}}>{tag.name}</Badge
		>
	{/each}
</div>
