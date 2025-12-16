<script lang="ts">
	import OctagonAlertIcon from '@lucide/svelte/icons/octagon-alert';
	import { Badge } from '$lib/components/ui/badge';

	const { status }: { status: string } = $props();
</script>

<Badge
	variant={status === 'clean' ? 'ghost' : 'destructive'}
	class={['rounded-md aspect-square h-7']}
	>{#if status === 'blocked'}<OctagonAlertIcon />
	{/if}</Badge
>
