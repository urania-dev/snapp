<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';

	const {
		class: classes,
		label,
		variant = 'outline'
	}: {
		class?: string;
		label: string;
		variant: 'default' | 'destructive' | 'ghost' | 'outline';
	} = $props();
</script>

<Badge {variant} class={['rounded-md aspect-square h-7', classes]}>{label}</Badge>
