<script lang="ts">
	import CircleIcon from '@lucide/svelte/icons/circle';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { m } from '$lib/paraglide/messages';

	let { enabled = false }: { enabled: boolean } = $props();
</script>

<Badge variant="ghost" class="px-0!">
	<CircleIcon class={['size-3! fill-current/20', enabled ? 'text-success' : 'text-destructive']} />
	{enabled ? m.enabled() : m.disabled()}
</Badge>
