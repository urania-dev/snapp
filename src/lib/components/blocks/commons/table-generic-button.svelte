<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Button } from '$lib/components/ui/button';

	const {
		label,
		variant = 'ghost',
		...props
	}: {
		label: string;
	} & ComponentProps<typeof Button> = $props();
</script>

<Button {variant} {...props}>{label}</Button>
