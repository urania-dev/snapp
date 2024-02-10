<script lang="ts">
	import { Small } from '$lib/ui/typography';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	export let urls: { label: string; href?: string }[] = [];
	let count = urls.length;
	$: count = urls.length;
</script>

<ol class="breadcrumb max-w-max pt-2 items-center">
	{#each urls as url, idx}
		{#if count !== idx + 1}
			<li class="crumb contents">
				<a class="anchor link flex items-center pb-0.5" href={url.href}>
					<Small>
						{url.label}
					</Small>
				</a>
			</li>
			<li class="crumb-separator" aria-hidden>
				<ChevronRight class="w-4 h-4 leading-none" />
			</li>
		{:else}
			<li class="crumb">
				<div class="flex items-center pb-0.5">
					<Small>
						{url.label}
					</Small>
				</div>
			</li>
		{/if}
	{/each}
</ol>

<style>
	:global(
			.breadcrumb > :not([hidden]) ~ :not([hidden]),
			.breadcrumb-nonresponsive > :not([hidden]) ~ :not([hidden])
		) {
		margin-left: 0.25rem !important;
	}
</style>
