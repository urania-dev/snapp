<script lang="ts">
	import type { ComponentProps } from 'svelte';

	import { Checkbox } from '$lib/components/ui/checkbox';

	let { checked = false, ...restProps }: ComponentProps<typeof Checkbox> = $props();
</script>

<Checkbox {checked} {...restProps} />
